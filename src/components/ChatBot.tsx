import React, { useState, useRef, useEffect } from 'react';
import { useApiKeys } from '../hooks/useApiKeys';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MessageSquare, X, Send, Bot, User, Loader2, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { savedApiKeys, reloadApiKeys } = useApiKeys();
  const genAI = useRef<GoogleGenerativeAI | null>(null);
  const chat = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasApiKey = !!savedApiKeys.gemini_api_key;

  useEffect(() => {
    if (hasApiKey) {
      genAI.current = new GoogleGenerativeAI(savedApiKeys.gemini_api_key);
      const SYSTEM_PROMPT = `
        Bạn là trợ lý AI nói tiếng Việt thân thiện. 
        Hãy trả lời ngắn gọn, súc tích, kèm ví dụ khi cần.
        `;
      chat.current = genAI.current.getGenerativeModel({ model: "gemini-2.0-flash" }).startChat(
        {systemInstruction: {role: "system", parts: [{ text: SYSTEM_PROMPT }]}, history: []}
      );
    }
  }, [hasApiKey, savedApiKeys.gemini_api_key]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleApiKeyUpdate = () => {
      reloadApiKeys();
    };

    window.addEventListener('apiKeysUpdated', handleApiKeyUpdate);

    return () => {
      window.removeEventListener('apiKeysUpdated', handleApiKeyUpdate);
    };
  }, [reloadApiKeys]);

  const handleSend = async () => {
    if (!input.trim() || !chat.current || isLoading || !hasApiKey) return;

    const userInput: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userInput]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chat.current.sendMessage(input);
      const response = await result.response;
      const text = response.text();
      
      const modelResponse: Message = { role: 'model', text: text };
      setMessages(prev => [...prev, modelResponse]);

    } catch (error) {
      console.error("Chatbot error:", error);
      const errorResponse: Message = { role: 'model', text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng kiểm tra lại API Key và thử lại." };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    // Only add greeting if opening, has API key, and chat is empty
    if (!isOpen && hasApiKey && messages.length === 0) {
      setMessages([{ role: 'model', text: 'Chào bạn! Tôi có thể giúp gì cho bạn hôm nay?' }]);
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform z-50"
        aria-label="Open chatbot"
      >
        <MessageSquare size={32} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-2xl border-b">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Bot className="text-blue-600"/>
              Trợ lý AI
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
              <X size={20} />
            </button>
          </div>

          {!hasApiKey ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50">
              <Key className="text-yellow-500 mb-4" size={48} />
              <h4 className="font-bold text-lg text-gray-800 mb-2">Chưa cấu hình API Key</h4>
              <p className="text-gray-600 mb-6">
                Bạn cần thiết lập API Key của Gemini để sử dụng chức năng này.
              </p>
              <Link 
                to="/accounts"
                onClick={() => setIsOpen(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Đi đến trang Cấu hình
              </Link>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0"><Bot size={20} /></div>}
                      <div className={`px-4 py-2 rounded-2xl max-w-xs break-words ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                      {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 shrink-0"><User size={20} /></div>}
                    </div>
                  ))}
                  {isLoading && (
                     <div className="flex items-start gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0"><Bot size={20} /></div>
                       <div className="px-4 py-2 rounded-2xl bg-white text-gray-800 border rounded-bl-none">
                         <Loader2 className="animate-spin" size={20} />
                       </div>
                     </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white rounded-b-2xl">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Nhập câu hỏi..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={isLoading}
                  />
                  <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50">
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

