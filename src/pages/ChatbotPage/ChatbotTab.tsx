import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatbotStream } from '../../services/apiService';
import { PaperPlaneIcon } from '@radix-ui/react-icons';
import { MoreHorizontal, Plus, X, Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { faqMobileService } from '../../services/faqMobileService';
import Swal from 'sweetalert2';

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
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showFaqFormIndex, setShowFaqFormIndex] = useState<number | null>(null);
  const [isSavingFaq, setIsSavingFaq] = useState(false);

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

  const handleAddToFaq = (messageText: string, messageIndex: number) => {
    setFaqQuestion(messageText);
    setFaqAnswer('');
    setShowFaqFormIndex(messageIndex);
    setActiveDropdown(null);
  };

  const handleCopyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      Swal.fire({
        icon: 'success',
        title: 'Đã sao chép',
        text: 'Nội dung đã được sao chép vào clipboard!',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể sao chép nội dung.',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
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
        answer: faqAnswer
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { text: input, sender: 'user', id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add a placeholder for the bot's response
    const botMessagePlaceholder: Message = { text: '', sender: 'bot', id: (Date.now() + 1).toString() };
    setMessages((prev) => [...prev, botMessagePlaceholder]);

    await chatbotStream(
      input,
      (chunk) => {
        try {
          // Assuming the chunk is a JSON string like {"response": "..."}
          const parsed = JSON.parse(chunk);
          const text = parsed.response || '';

          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.sender === 'bot') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, text: lastMessage.text + text },
              ];
            }
            return prev;
          });
        } catch (error) {
          // If chunk is not a valid JSON, append it directly.
          // This handles cases where the stream might send plain text chunks.
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.sender === 'bot') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, text: lastMessage.text + chunk },
              ];
            }
            return prev;
          });
        }
      },
      () => {
        setIsLoading(false);
      },
      (error) => {
        console.error('Error sending message:', error);
        let errorText = 'Sorry, something went wrong.';
        if (error.message) {
          errorText = error.message;
        }
        const errorMessage: Message = { text: errorText, sender: 'bot' };
        setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Chatbot</h2>
        <button 
          onClick={clearChat}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Clear Chat
        </button>
      </div>
      <div className="flex-grow p-4 border rounded-md mb-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* FAQ Form for this specific message - positioned to the left */}
              {showFaqFormIndex === index && msg.sender === 'user' && (
                <div className="mr-4 bg-blue-50 border border-blue-200 rounded p-2 space-y-2 w-64 self-start">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Thêm FAQ</span>
                    <button
                      onClick={handleCloseFaqForm}
                      className="p-0.5 text-blue-400 hover:text-blue-600 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <input
                        value={faqQuestion}
                        onChange={(e) => setFaqQuestion(e.target.value)}
                        placeholder="Câu hỏi..."
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <input
                        value={faqAnswer}
                        onChange={(e) => setFaqAnswer(e.target.value)}
                        placeholder="Câu trả lời..."
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={handleCloseFaqForm}
                      className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveFaq}
                      disabled={!faqQuestion.trim() || !faqAnswer.trim() || isSavingFaq}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSavingFaq ? (
                        <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="h-2 w-2" />
                      )}
                      <span>{isSavingFaq ? 'Lưu...' : 'Lưu'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className={`flex items-start space-x-2 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                {msg.sender === 'user' && msg.text.trim() && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === index ? null : index)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Thêm vào FAQ"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {activeDropdown === index && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                        <button
                          onClick={() => handleAddToFaq(msg.text, index)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 rounded-lg"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Thêm vào FAQ</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {msg.sender === 'bot' && msg.text.trim() && (
                  <div className="relative">
                    <button
                      onClick={() => handleCopyMessage(msg.text)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Sao chép nội dung"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow p-2 border rounded-md"
        />
        <button type="submit" disabled={isLoading} className="p-2 bg-blue-500 text-white rounded-md">
          <PaperPlaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatbotTab;