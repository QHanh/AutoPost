// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { getMyApiKey, regenerateMyApiKey } from '../services/apiService';
import { getChatbotSettings, updateChatbotSettings } from '../services/chatbotService';
import { FaCopy, FaEye, FaEyeSlash, FaSync, FaRobot, FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ApiIntegrationPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);

  // Chatbot settings state
  const [chatbotSettings, setChatbotSettings] = useState({
    chatbot_icon_url: '',
    chatbot_message_default: '',
    chatbot_callout: '',
    chatbot_name: ''
  });

  const fetchKey = async () => {
    try {
      setIsLoading(true);
      const data = await getMyApiKey();
      setApiKey(data.api_key);
      setScopes(data.scopes);
      setError(null);
    } catch (err) {
      setError('Failed to fetch API key. Do you have an active subscription?');
      setApiKey('');
      setScopes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchKey();
      await fetchChatbotSettings();
    };
    fetchInitialData();
  }, []);

  const fetchChatbotSettings = async () => {
    try {
      const settings = await getChatbotSettings();
      setChatbotSettings(prev => ({
        ...prev,
        ...settings
      }));
    } catch (error) {
      console.error('Error fetching chatbot settings:', error);
      toast.error('Failed to load chatbot settings');
    }
  };

  const handleChatbotSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChatbotSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChatbotSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateChatbotSettings(chatbotSettings);
      toast.success('Chatbot settings saved successfully!');
    } catch (error) {
      console.error('Error saving chatbot settings:', error);
      toast.error('Failed to save chatbot settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (window.confirm('Are you sure you want to regenerate your API key? Your old key will be invalidated immediately.')) {
      try {
        toast.loading('Regenerating key...');
        const data = await regenerateMyApiKey();
        setApiKey(data.api_key);
        setScopes(data.scopes);
        toast.dismiss();
        toast.success('API key regenerated successfully!');
      } catch (err) {
        toast.dismiss();
        toast.error('Failed to regenerate API key.');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };
  
  const CodeSnippet = ({ title, code, language }) => (
    <div className="bg-gray-900 rounded-lg p-4 mt-4">
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
      <pre><code className={`language-${language} text-sm`}>{code}</code></pre>
    </div>
  );

  const curlSnippet = `# Example cURL request to test the API
curl -X POST http://127.0.0.1:8010/chat/session_123 \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Xin chào, bạn có thể giúp gì cho tôi?",
    "customer_id": "YOUR_CUSTOMER_ID"
  }'`;

  const installationInstructions = `1. Add the following code to your HTML file where you want the chat widget to appear:
   - Replace YOUR_CUSTOMER_ID with your actual customer ID
   - The chat widget will automatically connect to the API using the settings from your dashboard
   - No API key is needed in the frontend code for security

2. Make sure your API server is running at http://127.0.0.1:8010
   or update the API_BASE_URL in the script to point to your server

3. Customize the appearance by modifying the CSS in the <style> section`;

  const scriptSnippet = `<!-- Add this div where you want the chat widget to appear -->
<div id="chatbot-container" data-customer-id="YOUR_CUSTOMER_ID"></div>

<!-- Add this script at the end of your body -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = "http://127.0.0.1:8010";
    let sessionId = null;
    let customerId = null;
    
    function createImageModal() {
        const modalHTML = `
            <div id="chatbot-image-modal">
                <span class="chatbot-modal-close">&times;</span>
                <img class="chatbot-modal-content">
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('chatbot-image-modal');
        const closeBtn = document.querySelector('.chatbot-modal-close');

        closeBtn.onclick = () => modal.style.display = "none";
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        };
    }

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
        if (!container) return;

        const iconUrl = settings?.chatbot_icon_url || 'https://chatbot.quandoiai.vn/icon2.png';
        const chatbotName = settings?.chatbot_name || 'Chatbot';
        const calloutMessage = settings?.chatbot_callout || '👋 Chào anh/chị, em là trợ lý Chatbot!';
        const defaultMessage = settings?.chatbot_message_default || 'Xin chào anh/chị, em là trợ lý Chatbot luôn sẵn sàng hỗ trợ anh/chị ạ!';

        container.innerHTML = `
            <style>
                .chatbot-button-container { position: relative; margin-bottom: 10px; }
                .chatbot-launcher {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 60px;
                    height: 60px;
                    background-color: #4f46e5;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    z-index: 2147483647;
                    transition: transform 0.2s;
                    border: none;
                }
                .chatbot-launcher:hover { transform: scale(1.1); }
                .chatbot-launcher img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
                .chatbot-window {
                    position: fixed;
                    bottom: 90px;
                    right: 20px;
                    width: 380px;
                    height: 600px;
                    background-color: white;
                    border-radius: 12px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    z-index: 2147483647;
                    transform: translateY(20px);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease-in-out;
                }
                .chatbot-window.open {
                    transform: translateY(0);
                    opacity: 1;
                    visibility: visible;
                }
                .chatbot-header {
                    background-color: #4f46e5;
                    color: white;
                    padding: 15px;
                    font-weight: 600;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .chatbot-messages {
                    flex: 1;
                    padding: 15px;
                    overflow-y: auto;
                    background-color: #f9fafb;
                }
                .message {
                    max-width: 80%;
                    margin-bottom: 12px;
                    padding: 10px 15px;
                    border-radius: 18px;
                    line-height: 1.4;
                    font-size: 14px;
                }
                .user-message {
                    background-color: #4f46e5;
                    color: white;
                    margin-left: auto;
                    border-bottom-right-radius: 4px;
                }
                .bot-message {
                    background-color: #e5e7eb;
                    color: #111827;
                    margin-right: auto;
                    border-bottom-left-radius: 4px;
                }
                .chatbot-input-form {
                    display: flex;
                    padding: 12px;
                    background-color: white;
                    border-top: 1px solid #e5e7eb;
                }
                .chatbot-input {
                    flex: 1;
                    border: 1px solid #d1d5db;
                    border-radius: 20px;
                    padding: 10px 20px;
                    font-size: 14px;
                    outline: none;
                }
                .chatbot-send-btn {
                    background-color: #4f46e5;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: 10px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .chatbot-send-btn:hover { background-color: #4338ca; }
                .typing-indicator { display: flex; padding: 10px; }
                .typing-indicator span {
                    width: 8px;
                    height: 8px;
                    background-color: #9ca3af;
                    border-radius: 50%;
                    margin: 0 2px;
                    animation: bounce 1.4s infinite ease-in-out;
                }
                .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
                .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-5px); }
                }
                #chatbot-image-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.8);
                    z-index: 10000;
                    justify-content: center;
                    align-items: center;
                }
                .chatbot-modal-content {
                    max-width: 90%;
                    max-height: 90%;
                    border-radius: 4px;
                }
                .chatbot-modal-close {
                    position: absolute;
                    top: 20px;
                    right: 30px;
                    color: #fff;
                    font-size: 40px;
                    cursor: pointer;
                }
                @media (max-width: 480px) {
                    .chatbot-window {
                        width: 100%;
                        height: 100%;
                        bottom: 0;
                        right: 0;
                        border-radius: 0;
                    }
                }
            </style>
            <div class="chatbot-button-container">
                <div class="chatbot-launcher">
                    <img src="${iconUrl}" alt="Chatbot">
                </div>
            </div>
            <div class="chatbot-window">
                <div class="chatbot-header">
                    ${chatbotName}
                    <button class="chatbot-close-btn">×</button>
                </div>
                <div class="chatbot-messages">
                    <div class="message bot-message">${defaultMessage}</div>
                </div>
                <form class="chatbot-input-form">
                    <input type="text" class="chatbot-input" placeholder="Nhập tin nhắn..." required>
                    <button type="submit" class="chatbot-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        `;
        
        attachEventListeners();
    }

    function attachEventListeners() {
        const launcher = document.querySelector('.chatbot-launcher');
        const chatWindow = document.querySelector('.chatbot-window');
        const closeBtn = document.querySelector('.chatbot-close-btn');
        const form = document.querySelector('.chatbot-input-form');
        const input = document.querySelector('.chatbot-input');
        const messagesContainer = document.querySelector('.chatbot-messages');

        launcher.addEventListener('click', () => {
            chatWindow.classList.toggle('open');
        });

        closeBtn.addEventListener('click', () => {
            chatWindow.classList.remove('open');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = input.value.trim();
            if (!message) return;

            // Add user message
            addMessage('user', message);
            input.value = '';

            // Show typing indicator
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = '<span></span><span></span><span></span>';
            messagesContainer.appendChild(typingIndicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            try {
                const response = await fetch(\`\${API_BASE_URL}/chat/\${sessionId}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: message,
                        customer_id: customerId || 'default_customer_id'
                    })
                });

                const data = await response.json();
                const botResponse = data.response?.reply || 'Xin lỗi, tôi không thể xử lý yêu cầu ngay lúc này.';
                
                // Remove typing indicator
                messagesContainer.removeChild(typingIndicator);
                
                // Add bot response
                addMessage('bot', botResponse);
                
            } catch (error) {
                console.error('Error:', error);
                messagesContainer.removeChild(typingIndicator);
                addMessage('bot', 'Xin lỗi, đã xảy ra lỗi khi kết nối đến máy chủ.');
            }
        });
    }

    function addMessage(type, content) {
        const messagesContainer = document.querySelector('.chatbot-messages');
        const messageElement = document.createElement('div');
        messageElement.className = \`message \${type}-message\`;
        messageElement.textContent = content;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Initialize
    function init() {
        customerId = document.getElementById('chatbot-container').getAttribute('data-customer-id') || 'default_customer_id';
        loadSession();
        createImageModal();
        
        // Fetch settings
        fetch(\`\${API_BASE_URL}/settings/\${customerId}\`)
            .then(response => response.json())
            .then(settings => {
                createChatbotUI(settings);
            })
            .catch(error => {
                console.error('Error loading chatbot settings:', error);
                createChatbotUI({}); // Fallback to default settings
            });
    }

    // Start the chatbot
    init();
});
</script>`;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">API Integration</h1>
        <p className="text-gray-400 mb-6">Integrate our chatbot into your application or website.</p>

        {/* Chatbot Settings Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <div className="flex items-center mb-4">
            <FaRobot className="text-indigo-400 mr-2" />
            <h2 className="text-xl font-semibold">Chatbot Settings</h2>
          </div>
          
          <form onSubmit={handleSaveChatbotSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chatbot_name" className="block text-sm font-medium text-gray-300 mb-1">
                  Chatbot Name
                </label>
                <input
                  type="text"
                  id="chatbot_name"
                  name="chatbot_name"
                  value={chatbotSettings.chatbot_name || ''}
                  onChange={handleChatbotSettingChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="My Chatbot"
                />
              </div>
              
              <div>
                <label htmlFor="chatbot_icon_url" className="block text-sm font-medium text-gray-300 mb-1">
                  Chatbot Icon URL
                </label>
                <input
                  type="url"
                  id="chatbot_icon_url"
                  name="chatbot_icon_url"
                  value={chatbotSettings.chatbot_icon_url || ''}
                  onChange={handleChatbotSettingChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/chatbot-icon.png"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="chatbot_callout" className="block text-sm font-medium text-gray-300 mb-1">
                Callout Text
              </label>
              <input
                type="text"
                id="chatbot_callout"
                name="chatbot_callout"
                value={chatbotSettings.chatbot_callout || ''}
                onChange={handleChatbotSettingChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="How can I help you today?"
              />
            </div>
            
            <div>
              <label htmlFor="chatbot_message_default" className="block text-sm font-medium text-gray-300 mb-1">
                Default Welcome Message
              </label>
              <textarea
                id="chatbot_message_default"
                name="chatbot_message_default"
                rows={3}
                value={chatbotSettings.chatbot_message_default || ''}
                onChange={handleChatbotSettingChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Hello! I'm your AI assistant. How can I help you today?"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Your API Key</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <div className="relative flex-grow">
                  <input
                    type={isKeyVisible ? 'text' : 'password'}
                    readOnly
                    value={apiKey}
                    className="w-full bg-gray-900 text-white rounded-md p-3 pr-24 font-mono text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title={isKeyVisible ? 'Hide key' : 'Show key'}
                    >
                      {isKeyVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey)}
                      className="ml-3 text-gray-400 hover:text-white transition-colors"
                      title="Copy key"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
                  title="Regenerate key"
                >
                  <FaSync className="mr-2" />
                  Regenerate
                </button>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold">Permissions (Scopes):</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {scopes.length > 0 ? (
                    scopes.map(scope => (
                      <span key={scope} className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                        {scope}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No scopes found.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {!isLoading && !error && (
            <div className="mt-8 space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Installation Instructions</h2>
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">{installationInstructions}</pre>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-xl font-semibold mb-4">API Example (cURL)</h2>
                    <CodeSnippet 
                        title="Test the API directly with cURL" 
                        code={curlSnippet} 
                        language="bash" 
                    />
                </div>
                
                <div>
                    <h2 className="text-xl font-semibold mb-4">Chat Widget Code</h2>
                    <p className="text-gray-400 mb-4">Add this code to your website to embed the chat widget:</p>
                    <CodeSnippet 
                        title="HTML & JavaScript for Chat Widget" 
                        code={scriptSnippet} 
                        language="html" 
                    />
                </div>
            </div>
        )}
      </div>
    </>
  );
};

export default ApiIntegrationPage; 