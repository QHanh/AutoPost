import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatbotStream } from '../../services/apiService';
import { PaperPlaneIcon } from '@radix-ui/react-icons';
import ReactMarkdown from 'react-markdown';

interface Message {
  text: string;
  sender: 'user' | 'bot';
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add a placeholder for the bot's response
    const botMessagePlaceholder: Message = { text: '', sender: 'bot' };
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
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
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