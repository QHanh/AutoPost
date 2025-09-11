import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatbotStream } from '../../services/apiService';
import { PaperPlaneIcon } from '@radix-ui/react-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MessageActionDropdown from '../../components/MessageActionDropdown';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  id?: string;
}

const ChatbotTab: React.FC = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem('chatbotMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    localStorage.setItem('chatbotMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatbotMessages');
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: input,
      sender: 'user',
      id: Date.now().toString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const botMessage: Message = {
        text: '',
        sender: 'bot',
        id: (Date.now() + 1).toString()
      };

      setMessages(prev => [...prev, botMessage]);

      await chatbotStream(
        input,
        (chunk) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.sender === 'bot') {
              lastMessage.text += chunk;
            }
            return newMessages;
          });
        },
        () => {
          // onComplete callback - called when streaming is finished
          console.log('Chatbot streaming completed');
        },
        (error) => {
          console.error('Chatbot error:', error);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.sender === 'bot') {
              lastMessage.text = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.';
            }
            return newMessages;
          });
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <h2 className="text-2xl font-bold text-gray-800">Chatbot AI</h2>
        <button
          onClick={clearChat}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Xóa lịch sử
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Chào bạn! Tôi là chatbot AI. Hãy đặt câu hỏi cho tôi.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex items-start space-x-2 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {(() => {
                  // Progressively strip JSON wrapper if backend returns {"response":"..."}
                  let displayText = msg.text ?? '';
                  if (displayText.startsWith('{"response":"')) {
                    // Remove leading wrapper
                    displayText = displayText.replace(/^\{\"response\":\"/, '');
                    // Remove trailing wrapper if present
                    displayText = displayText.replace(/\"\}\s*$/, '');
                    // Unescape common sequences for nicer rendering
                    displayText = displayText
                      .split('\\n').join('\n')
                      .split('\\t').join('\t')
                      .replace(/\\"/g, '"');
                  }
                  // Auto-convert direct image URLs to Markdown image syntax for inline preview
                  const imageUrlRegex = /(https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|svg))/gi;
                  displayText = displayText.replace(imageUrlRegex, (url) => `![image](${url})`);
                  return (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        ),
                        img: (props) => (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <img {...props} style={{ maxWidth: '100%', borderRadius: '0.5rem' }} loading="lazy" />
                        ),
                      }}
                    >
                      {displayText}
                    </ReactMarkdown>
                  );
                })()}
              </div>
              {msg.sender === 'user' && msg.text.trim() && (
                <MessageActionDropdown
                  messageText={msg.text}
                  isVisible={activeDropdown === index}
                  onToggle={() => setActiveDropdown(activeDropdown === index ? null : index)}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn của bạn..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <PaperPlaneIcon className="w-4 h-4" />
            {isLoading ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotTab;
