// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { getMyApiKey, regenerateMyApiKey } from '../services/apiService';
import { FaCopy, FaEye, FaEyeSlash, FaSync } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ApiIntegrationPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);

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
    fetchKey();
  }, []);

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

  const curlSnippet = `curl -X POST http://your-api-domain.com/api/v1/chatbot/chat \\
-H "Content-Type: application/json" \\
-H "X-API-Key: ${apiKey}" \\
-d '{
    "query": "Hello, how can you help me?",
    "llm_provider": "google_genai"
}'`;

  const scriptSnippet = `<div id="my-chatbot-container"></div>

<script>
  const chatbotContainer = document.getElementById('my-chatbot-container');
  
  // Basic styling for the chat widget (customize as needed)
  chatbotContainer.innerHTML = \`
    <style>
      /* Add your chat widget styles here */
    </style>
    <div class="chat-widget">
      <div class="chat-messages"></div>
      <input type="text" class="chat-input" placeholder="Type your message...">
    </div>
  \`;

  const chatInput = chatbotContainer.querySelector('.chat-input');
  
  chatInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && chatInput.value.trim() !== '') {
      const userQuery = chatInput.value;
      // TODO: Display user message in chat-messages
      
      const response = await fetch('http://your-api-domain.com/api/v1/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '${apiKey}'
        },
        body: JSON.stringify({
          query: userQuery,
          llm_provider: 'google_genai' // or 'openai'
        })
      });
      
      const data = await response.json();
      
      // TODO: Display bot response in chat-messages
      console.log(data.data.response);
      
      chatInput.value = '';
    }
  });
</script>`;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">API Integration</h1>
        <p className="text-gray-400 mb-6">Integrate our chatbot into your application or website.</p>

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
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Integration Examples</h2>
                <CodeSnippet title="cURL Example" code={curlSnippet} language="bash" />
                <CodeSnippet title="JavaScript Snippet for Websites" code={scriptSnippet} language="html" />
            </div>
        )}
      </div>
    </>
  );
};

export default ApiIntegrationPage; 