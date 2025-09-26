// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { getMyApiKey, regenerateMyApiKey } from '../services/apiService';
import { getChatbotSettings, updateChatbotSettings } from '../services/chatbotService';
import { FaCopy, FaEye, FaEyeSlash, FaSync, FaRobot, FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';

// --- COMPONENT CON ---
// Component để hiển thị các đoạn mã, giúp tái sử dụng và code gọn gàng hơn
const CodeSnippet = ({ title, code, language }) => {
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã sao chép vào clipboard!');
    };
    
    return (
        <div className="bg-gray-900 rounded-lg p-4 mt-4 relative">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-400">{title}</h3>
                <button
                    onClick={() => copyToClipboard(code)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copy code"
                >
                    <FaCopy />
                </button>
            </div>
            <pre><code className={`language-${language} text-sm whitespace-pre-wrap`}>{code}</code></pre>
        </div>
    );
};


// --- COMPONENT CHÍNH ---
const ApiIntegrationPage: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>('');
    const [scopes, setScopes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);

    const [chatbotSettings, setChatbotSettings] = useState({
        chatbot_icon_url: '',
        chatbot_message_default: '',
        chatbot_callout: '',
        chatbot_name: ''
    });

    // --- CÁC HÀM XỬ LÝ DỮ LIỆU ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const apiKeyData = await getMyApiKey();
                setApiKey(apiKeyData.api_key);
                setScopes(apiKeyData.scopes);
                
                if (apiKeyData.api_key) {
                    const settings = await getChatbotSettings();
                    setChatbotSettings(prev => ({ ...prev, ...settings }));
                }
                setError(null);
            } catch (err) {
                setError('Không thể tải API key. Bạn đã đăng ký gói dịch vụ chưa?');
                setApiKey('');
                setScopes([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleChatbotSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setChatbotSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChatbotSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateChatbotSettings(chatbotSettings);
            toast.success('Lưu cài đặt Chatbot thành công!');
        } catch (error) {
            toast.error('Lưu cài đặt thất bại.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRegenerate = async () => {
        if (window.confirm('Bạn có chắc muốn tạo lại API key? Key cũ sẽ bị vô hiệu hóa ngay lập tức.')) {
            try {
                toast.loading('Đang tạo key mới...');
                const data = await regenerateMyApiKey();
                setApiKey(data.api_key);
                setScopes(data.scopes);
                toast.dismiss();
                toast.success('Tạo lại API key thành công!');
            } catch (err) {
                toast.dismiss();
                toast.error('Tạo lại API key thất bại.');
            }
        }
    };

    const copyApiKey = () => {
        navigator.clipboard.writeText(apiKey);
        toast.success('Đã sao chép API key!');
    };

    // --- CÁC ĐOẠN MÃ ĐỂ SAO CHÉP ---
    // Sử dụng useMemo để không phải tạo lại các chuỗi này mỗi khi component re-render
    const API_BASE_URL = "http://127.0.0.1:8010"; // Dễ dàng thay đổi URL tại đây

    const curlSnippet = useMemo(() => `# Ví dụ cURL để kiểm tra API
# Thay YOUR_CUSTOMER_ID bằng ID khách hàng của bạn
curl -X POST ${API_BASE_URL}/chat/session_123 \\
     -H "Content-Type: application/json" \\
     -H "Authorization: Bearer ${apiKey}" \\
     -d '{
         "query": "Xin chào, bạn có thể giúp gì cho tôi?",
         "customer_id": "YOUR_CUSTOMER_ID"
     }'`, [apiKey]);

    const installationInstructions = useMemo(() => `1. Chèn đoạn mã HTML & JavaScript vào trang web của bạn.
2. Thay thế 'YOUR_CUSTOMER_ID' bằng ID khách hàng thực tế của bạn.
3. Chat widget sẽ tự động kết nối và lấy cài đặt từ dashboard.
4. Vì lý do bảo mật, bạn không cần đưa API key vào mã nguồn frontend.
5. Đảm bảo API server của bạn đang chạy tại ${API_BASE_URL} hoặc cập nhật hằng số API_BASE_URL trong script.`, []);
    
    const scriptSnippet = useMemo(() => `<div id="chatbot-container" data-customer-id="YOUR_CUSTOMER_ID"></div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = "${API_BASE_URL}";
    let sessionId = null;
    let customerId = null;

    function loadSession() {
        const storedSession = sessionStorage.getItem('chatbot_session_id');
        if (storedSession) {
            sessionId = storedSession;
        } else {
            sessionId = \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
            sessionStorage.setItem('chatbot_session_id', sessionId);
        }
    }

    function createChatbotUI(settings) {
        const container = document.getElementById('chatbot-container');
        if (!container) {
            console.error('Chatbot container not found!');
            return;
        }

        const iconUrl = settings?.chatbot_icon_url || 'https://chatbot.quandoiai.vn/icon2.png';
        const chatbotName = settings?.chatbot_name || 'Chatbot';
        const defaultMessage = settings?.chatbot_message_default || 'Xin chào, tôi có thể giúp gì cho bạn?';

        container.innerHTML = \`
            <style>
                /* CSS được thu gọn để dễ đọc, bạn có thể copy toàn bộ CSS từ file gốc */
                .chatbot-launcher { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background-color: #4f46e5; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 24px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 2147483647; transition: transform 0.2s; border: none; }
                .chatbot-launcher:hover { transform: scale(1.1); }
                .chatbot-launcher img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
                .chatbot-window { position: fixed; bottom: 90px; right: 20px; width: 380px; height: 600px; background-color: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; z-index: 2147483647; transform: translateY(20px); opacity: 0; visibility: hidden; transition: all 0.3s ease-in-out; }
                .chatbot-window.open { transform: translateY(0); opacity: 1; visibility: visible; }
                .chatbot-header { background-color: #4f46e5; color: white; padding: 15px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
                .chatbot-messages { flex: 1; padding: 15px; overflow-y: auto; background-color: #f9fafb; }
                .message { max-width: 80%; margin-bottom: 12px; padding: 10px 15px; border-radius: 18px; line-height: 1.4; font-size: 14px; }
                .user-message { background-color: #4f46e5; color: white; margin-left: auto; border-bottom-right-radius: 4px; }
                .bot-message { background-color: #e5e7eb; color: #111827; margin-right: auto; border-bottom-left-radius: 4px; }
                .chatbot-input-form { display: flex; padding: 12px; background-color: white; border-top: 1px solid #e5e7eb; }
                .chatbot-input { flex: 1; border: 1px solid #d1d5db; border-radius: 20px; padding: 10px 20px; font-size: 14px; outline: none; }
                .chatbot-send-btn { background-color: #4f46e5; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-left: 10px; cursor: pointer; }
                @media (max-width: 480px) { .chatbot-window { width: 100%; height: 100%; bottom: 0; right: 0; border-radius: 0; } }
            </style>
            <div class="chatbot-launcher"><img src="\${iconUrl}" alt="Chatbot"></div>
            <div class="chatbot-window">
                <div class="chatbot-header">\${chatbotName}<button class="chatbot-close-btn" style="background:none;border:none;color:white;font-size:24px;cursor:pointer;">&times;</button></div>
                <div class="chatbot-messages"><div class="message bot-message">\${defaultMessage}</div></div>
                <form class="chatbot-input-form">
                    <input type="text" class="chatbot-input" placeholder="Nhập tin nhắn..." required>
                    <button type="submit" class="chatbot-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </form>
            </div>
        \`;
        
        attachEventListeners();
    }

    function attachEventListeners() {
        const launcher = document.querySelector('.chatbot-launcher');
        const chatWindow = document.querySelector('.chatbot-window');
        const closeBtn = document.querySelector('.chatbot-close-btn');
        const form = document.querySelector('.chatbot-input-form');
        const input = document.querySelector('.chatbot-input');

        launcher.addEventListener('click', () => chatWindow.classList.toggle('open'));
        closeBtn.addEventListener('click', () => chatWindow.classList.remove('open'));
        form.addEventListener('submit', handleFormSubmit);
    }
    
    function addMessage(type, content) {
        const messagesContainer = document.querySelector('.chatbot-messages');
        const messageElement = document.createElement('div');
        messageElement.className = \`message \${type}-message\`;
        messageElement.textContent = content;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const input = document.querySelector('.chatbot-input');
        const message = input.value.trim();
        if (!message) return;

        addMessage('user', message);
        input.value = '';

        try {
            const response = await fetch(\`\${API_BASE_URL}/chat/\${sessionId}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: message, customer_id: customerId })
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            const botResponse = data.response?.reply || 'Xin lỗi, tôi không thể xử lý yêu cầu.';
            addMessage('bot', botResponse);
        } catch (error) {
            console.error('Error:', error);
            addMessage('bot', 'Đã có lỗi xảy ra khi kết nối đến máy chủ.');
        }
    }

    function init() {
        const container = document.getElementById('chatbot-container');
        customerId = container.getAttribute('data-customer-id');
        if (!customerId || customerId === 'YOUR_CUSTOMER_ID') {
            console.warn('Chatbot: customerId is not set. Please set data-customer-id attribute.');
            // You can choose to hide the chatbot if ID is not set
            // container.style.display = 'none';
            // return;
        }

        loadSession();

        fetch(\`\${API_BASE_URL}/settings/\${customerId || 'default'}\`)
            .then(res => res.json())
            .then(settings => createChatbotUI(settings))
            .catch(error => {
                console.error('Error loading chatbot settings:', error);
                createChatbotUI({}); // Fallback to default settings
            });
    }
    
    init();
});
</script>`, []);
    
    // --- RENDER COMPONENT ---
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Tích hợp API</h1>
            <p className="text-gray-400 mb-6">Tích hợp chatbot của chúng tôi vào website của bạn.</p>
            
            {/* Phần hiển thị chính */}
            <div className="space-y-8">
                {/* Luôn hiển thị phần cài đặt chatbot nếu có key */}
                {apiKey && (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="flex items-center mb-4">
                            <FaRobot className="text-indigo-400 mr-2" size={20} />
                            <h2 className="text-xl font-semibold">Tùy chỉnh Chatbot</h2>
                        </div>
                        <form onSubmit={handleSaveChatbotSettings} className="space-y-4">
                            {/* Các input cho chatbot settings... */}
                            {/* Chatbot Name & Icon */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="chatbot_name" className="block text-sm font-medium text-gray-300 mb-1">Tên Chatbot</label>
                                    <input type="text" id="chatbot_name" name="chatbot_name" value={chatbotSettings.chatbot_name || ''} onChange={handleChatbotSettingChange} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="My Chatbot" />
                                </div>
                                <div>
                                    <label htmlFor="chatbot_icon_url" className="block text-sm font-medium text-gray-300 mb-1">URL Icon Chatbot</label>
                                    <input type="url" id="chatbot_icon_url" name="chatbot_icon_url" value={chatbotSettings.chatbot_icon_url || ''} onChange={handleChatbotSettingChange} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://example.com/icon.png" />
                                </div>
                            </div>
                            {/* Default Welcome Message */}
                            <div>
                                <label htmlFor="chatbot_message_default" className="block text-sm font-medium text-gray-300 mb-1">Tin nhắn chào mừng</label>
                                <textarea id="chatbot_message_default" name="chatbot_message_default" rows={3} value={chatbotSettings.chatbot_message_default || ''} onChange={handleChatbotSettingChange} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Xin chào! Tôi có thể giúp gì cho bạn?"></textarea>
                            </div>
                            {/* Save Button */}
                            <div className="flex justify-end">
                                <button type="submit" disabled={isSaving} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                                    {isSaving ? 'Đang lưu...' : <><FaSave className="mr-2" /> Lưu cài đặt</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                {/* Phần API Key */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Your API Key</h2>
                    {isLoading ? (
                        <p className="text-gray-400">Đang tải API key...</p>
                    ) : error ? (
                        <p className="text-red-400">{error}</p>
                    ) : apiKey ? (
                        <>
                            <div className="flex items-center space-x-4">
                                <div className="relative flex-grow">
                                    <input type={isKeyVisible ? 'text' : 'password'} readOnly value={apiKey} className="w-full bg-gray-900 text-white rounded-md p-3 pr-24 font-mono text-sm" />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="text-gray-400 hover:text-white" title={isKeyVisible ? 'Ẩn key' : 'Hiện key'}>{isKeyVisible ? <FaEyeSlash /> : <FaEye />}</button>
                                        <button onClick={copyApiKey} className="ml-3 text-gray-400 hover:text-white" title="Copy key"><FaCopy /></button>
                                    </div>
                                </div>
                                <button onClick={handleRegenerate} className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md" title="Tạo lại key"><FaSync /></button>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-semibold">Quyền (Scopes):</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {scopes.length > 0 ? scopes.map(scope => (<span key={scope} className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">{scope}</span>)) : <p className="text-gray-500 text-sm">Không tìm thấy scope.</p>}
                                </div>
                            </div>
                        </>
                    ) : (
                         <p className="text-yellow-400">Không tìm thấy API key. Vui lòng đăng ký gói dịch vụ để tạo key.</p>
                    )}
                </div>

                {/* PHẦN QUAN TRỌNG: Chỉ hiển thị khi đã có API key */}
                {apiKey && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">1. Hướng dẫn cài đặt</h2>
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <pre className="whitespace-pre-wrap text-sm text-gray-300">{installationInstructions}</pre>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-2">2. Mã nhúng Chat Widget</h2>
                            <p className="text-gray-400 mb-2">Sao chép và dán đoạn mã này vào trang web của bạn.</p>
                            <CodeSnippet
                                title="HTML & JavaScript cho Chat Widget"
                                code={scriptSnippet}
                                language="html"
                            />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-2">3. Ví dụ kiểm tra API (cURL)</h2>
                             <p className="text-gray-400 mb-2">Sử dụng cURL trong terminal để kiểm tra API hoạt động.</p>
                            <CodeSnippet
                                title="Kiểm tra API trực tiếp với cURL"
                                code={curlSnippet}
                                language="bash"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiIntegrationPage;