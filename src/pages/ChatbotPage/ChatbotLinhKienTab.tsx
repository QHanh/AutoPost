import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Image as ImageIcon, Loader, Trash2 } from 'lucide-react';

interface Message {
    user: string;
    bot: string;
    timestamp?: string;
    images?: Array<{
        product_name: string;
        image_url: string;
        product_link: string;
    }>;
}

interface ChatResponse {
    reply: string;
    history: Message[];
    images?: Array<{
        product_name: string;
        image_url: string;
        product_link: string;
    }>;
    has_images?: boolean;
    customer_info?: any;
    has_purchase?: boolean;
    human_handover_required?: boolean;
    has_negativity?: boolean;
    type?: string; // Added for API key requirement
    message?: string; // Added for API key requirement
}

const ChatbotLinhKienTab: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load messages từ localStorage khi component mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('chatbot_linhkien_messages');
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch (error) {
                console.error('Lỗi khi load messages từ localStorage:', error);
                localStorage.removeItem('chatbot_linhkien_messages');
            }
        }
    }, []);

    // Lưu messages vào localStorage mỗi khi messages thay đổi
    useEffect(() => {
        localStorage.setItem('chatbot_linhkien_messages', JSON.stringify(messages));
    }, [messages]);

    // Tự động scroll xuống tin nhắn mới nhất
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Clear chat history
    const clearChatHistory = () => {
        if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) {
            setMessages([]);
            localStorage.removeItem('chatbot_linhkien_messages');
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() && !selectedImage) return;

        setIsLoading(true);
        const userMessage = inputMessage || '[Đã gửi hình ảnh]';
        const timestamp = new Date().toLocaleTimeString();

        // Thêm tin nhắn user ngay lập tức
        const newUserMessage: Message = {
            user: userMessage,
            bot: '',
            timestamp
        };
        
        setMessages(prev => [...prev, newUserMessage]);

        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            
            // Sử dụng API endpoint mới cho chatbot linh kiện
            formData.append('message', inputMessage);
            formData.append('model_choice', 'gemini');
            
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-linhkien/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ChatResponse = await response.json();
            
            // Kiểm tra nếu response là thông báo yêu cầu API key
            if (data.type === 'api_key_required') {
                setMessages(prev => {
                    const updatedMessages = [...prev];
                    const lastMessageIndex = updatedMessages.length - 1;
                    if (lastMessageIndex >= 0) {
                        updatedMessages[lastMessageIndex] = {
                            ...updatedMessages[lastMessageIndex],
                            bot: data.message || 'Vui lòng nhập Gemini API key ở trang cấu hình để sử dụng chatbot'
                        };
                    }
                    return updatedMessages;
                });
                return;
            }
            
            // Cập nhật tin nhắn bot với phản hồi từ API
            if (data.reply) {
                setMessages(prev => {
                    const updatedMessages = [...prev];
                    const lastMessageIndex = updatedMessages.length - 1;
                    if (lastMessageIndex >= 0) {
                        updatedMessages[lastMessageIndex] = {
                            ...updatedMessages[lastMessageIndex],
                            bot: data.reply,
                            images: data.images || [] // Thêm ảnh từ response
                        };
                    }
                    return updatedMessages;
                });
                
                // Focus vào input sau khi bot trả lời xong
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }
            
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            // Cập nhật tin nhắn lỗi
            setMessages(prev => {
                const updatedMessages = [...prev];
                const lastMessageIndex = updatedMessages.length - 1;
                if (lastMessageIndex >= 0) {
                    updatedMessages[lastMessageIndex] = {
                        ...updatedMessages[lastMessageIndex],
                        bot: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
                    };
                }
                return updatedMessages;
            });
        } finally {
            setInputMessage('');
            setSelectedImage(null);
            setImagePreview(null);
            setIsLoading(false);
            // Focus vào input sau khi gửi tin nhắn
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
            {/* Header - Ghim lại khi cuộn */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        <div>
                            <h3 className="font-semibold">Chatbot Linh Kiện</h3>
                            <p className="text-xs opacity-90">Hỗ trợ tư vấn linh kiện</p>
                        </div>
                    </div>
                    <button
                        onClick={clearChatHistory}
                        className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
                        title="Xóa lịch sử chat"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main content with scrollable messages area */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4 pb-20">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-8">
                            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg mb-2">Xin chào! Tôi là chatbot hỗ trợ tư vấn linh kiện điện thoại.</p>
                            <p className="text-sm">Bạn có thể hỏi về linh kiện hoặc gửi hình ảnh để tôi hỗ trợ.</p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div key={index} className="space-y-2">
                            {/* User message */}
                            {message.user && (
                                <div className="flex justify-end">
                                    <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[70%] flex items-start gap-2 shadow-sm">
                                        <User className="w-4 h-4 mt-1 flex-shrink-0" />
                                        <div>
                                            <span className="whitespace-pre-wrap">{message.user}</span>
                                            {message.timestamp && (
                                                <div className="text-xs opacity-70 mt-1">{message.timestamp}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bot message */}
                            {message.bot && (
                                <div className="flex justify-start">
                                    <div className="bg-white text-gray-800 p-3 rounded-lg max-w-[70%] flex items-start gap-2 shadow-sm border">
                                        <Bot className="w-4 h-4 mt-1 flex-shrink-0 text-blue-500" />
                                        <div className="w-full">
                                            <div className="whitespace-pre-wrap mb-3">{message.bot}</div>
                                            
                                            {/* Hiển thị ảnh từ response */}
                                            {message.images && message.images.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                                        📸 Hình ảnh sản phẩm:
                                                    </div>
                                                    {message.images.map((img, imgIndex) => (
                                                        <div key={imgIndex} className="border rounded-lg p-3 bg-gray-50">
                                                            <img 
                                                                src={img.image_url} 
                                                                alt={img.product_name}
                                                                className="w-full h-48 object-cover rounded-lg mb-2"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTEwQzExMC41IDExMCAxMTkgMTAxLjUgMTE5IDkxQzExOSA4MC41IDExMC41IDcyIDEwMCA3MkM4OS41IDcyIDgxIDgwLjUgODEgOTFDODEgMTAxLjUgODkuNSAxMTAgMTAwIDExMHoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwMCAxMzBDMTEwLjUgMTMwIDExOSAxMjEuNSAxMTkgMTExQzExOSAxMDAuNSAxMTAuNSA5MiAxMDAgOTJDODkuNSA5MiA4MSAxMDAuNSA4MSAxMTFDODEgMTIxLjUgODkuNSAxMzAgMTAwIDEzMHoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                                                                }}
                                                            />
                                                            <div className="text-sm font-medium text-gray-800 mb-1">
                                                                {img.product_name}
                                                            </div>
                                                            {img.product_link && (
                                                                <a 
                                                                    href={img.product_link} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                                                                >
                                                                    Xem chi tiết
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {message.timestamp && (
                                                <div className="text-xs text-gray-500 mt-2">{message.timestamp}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-gray-800 p-3 rounded-lg flex items-center gap-2 shadow-sm border">
                                <Bot className="w-4 h-4 text-blue-500" />
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Đang xử lý...</span>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
                <div className="shrink-0 p-4 border-t bg-white">
                    <div className="relative inline-block">
                        <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-w-32 max-h-32 rounded-lg border shadow-sm"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Input - Ghim ở cuối trang */}
            <div className="sticky bottom-0 left-0 right-0 p-2 border-t bg-white shadow-lg z-10">
                <div className="flex gap-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-100"
                        title="Chọn hình ảnh"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatbotLinhKienTab; 