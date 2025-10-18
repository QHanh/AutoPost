import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatbotStream, resetChatbotHistory } from '../../services/apiService';
import { PaperPlaneIcon } from '@radix-ui/react-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MessageActionDropdown from '../../components/MessageActionDropdown';
import Swal from 'sweetalert2';
import { faqMobileService } from '../../services/faqMobileService';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  id?: string;
}

const ChatbotTab: React.FC = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem('chatbotMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showFaqFormIndex, setShowFaqFormIndex] = useState<number | null>(null);
  const [isSavingFaq, setIsSavingFaq] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);

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

  const handleSaveFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Thông báo',
        text: 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời.',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setIsSavingFaq(true);
    try {
      await faqMobileService.addFaq({
        question: faqQuestion,
        answer: faqAnswer,
        classification: 'chatbot'
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'FAQ đã được thêm thành công!',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
      setShowFaqFormIndex(null);
      setFaqQuestion('');
      setFaqAnswer('');
    } catch (error) {
      console.error('Error adding FAQ:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error instanceof Error ? error.message : 'Không thể thêm FAQ. Vui lòng thử lại.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsSavingFaq(false);
    }
  };

  const handleCloseFaqForm = () => {
    setShowFaqFormIndex(null);
    setFaqQuestion('');
    setFaqAnswer('');
  };

  const handleResetBot = async () => {
    setIsResetting(true);
    try {
      await resetChatbotHistory();
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Bot đã được reset.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      console.error('Error resetting bot:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error instanceof Error ? error.message : 'Không thể reset bot. Vui lòng thử lại.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const sendMessage = async () => {
    if ((!(input.trim()) && !(imageUrl && imageUrl.trim()) && !imageBase64) || isLoading) return;

    const userMessage: Message = {
      text: imageUrl && imageUrl.trim() ? `${input}\n${imageUrl.trim()}` : input,
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
          // Focus vào input sau khi bot trả lời xong
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
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
        },
        { image_url: imageUrl?.trim() || undefined, image_base64: imageBase64 || undefined }
      );
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setImageUrl('');
      setImageBase64(null);
      try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white relative">
      {/* Header */}
      <div className="sticky top-0 z-20 flex justify-between items-center px-4 py-3 shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold">Chatbot</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetBot}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            title="Reset bot nếu bạn vừa chỉnh sửa cài đặt, prompt."
            disabled={isResetting}
          >
            {isResetting ? 'Đang reset...' : 'Reset bot'}
          </button>
          <button
            onClick={clearChat}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Main content with scrollable messages area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4 pb-20">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>Chào bạn! Tôi là chatbot AI. Hãy đặt câu hỏi cho tôi.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex items-start space-x-2 mt-4 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
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
                      displayText = displayText.replace(/^\{"response":"/, '');
                      // Remove trailing wrapper if present
                      displayText = displayText.replace(/"\}\s*$/, '');
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
      </div>

      {/* Input - Ghim ở cuối trang */}
      <div className="sticky bottom-0 left-0 right-0 p-3 bg-white border-t shadow-sm z-10">
        <div className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn của bạn..."
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <div className="flex items-center gap-2">
            <input
              type="url"
              inputMode="url"
              placeholder="Link ảnh (tùy chọn)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) { setImageBase64(null); return; }
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  const commaIdx = result.indexOf(',');
                  const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
                  setImageBase64(base64);
                };
                reader.readAsDataURL(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-60"
            >
              Chọn ảnh
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={sendMessage}
              disabled={!(input.trim() || (imageUrl && imageUrl.trim()) || imageBase64) || isLoading}
              className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <PaperPlaneIcon className="w-4 h-4" />
              {isLoading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotTab;
