import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Eye, X, File, Link, Edit3, Globe, StopCircle } from 'lucide-react';

interface Document {
  id: string;
  text: string;
  source?: string;
}

const DocumentsTab: React.FC = () => {
  // Function to get appropriate icon based on file extension
  const getFileIcon = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return <File className="w-4 h-4 text-red-600" />; // PDF icon in red
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-600" />; // Word icon in blue
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-600" />; // Text icon in gray
      case 'url':
        return <Link className="w-4 h-4 text-green-600" />; // Link icon in green
      default:
        // No extension or unknown extension - manual text input
        return <Edit3 className="w-4 h-4 text-purple-600" />; // Manual input icon in purple
    }
  };
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlSourceName, setUrlSourceName] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textSourceName, setTextSourceName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteSourceName, setWebsiteSourceName] = useState('');
  const [isUploadingWebsite, setIsUploadingWebsite] = useState(false);
  const [websiteProgress, setWebsiteProgress] = useState<string[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [viewingSource, setViewingSource] = useState<{ source: string; content: string } | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load data immediately without blocking UI
    loadDocuments();
    loadSources();
  }, []);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const loadDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để quản lý tài liệu' });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.items || []);
      } else {
        throw new Error('Không thể tải danh sách tài liệu');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setMessage({ type: 'error', text: 'Không thể tải danh sách tài liệu. Vui lòng thử lại.' });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadSources = async () => {
    try {
      setIsLoadingSources(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/sources`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
      }
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setIsLoadingSources(false);
    }
  };

  const uploadText = async () => {
    if (!textInput.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập nội dung văn bản' });
      return;
    }

    if (!textSourceName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên tài liệu' });
      return;
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để upload tài liệu' });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/upload-text`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: textInput,
          source: textSourceName
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Văn bản đã được upload thành công!' });
        setTextInput('');
        setTextSourceName('');
        // Reload to get real data
        loadDocuments();
        loadSources();
      } else {
        throw new Error('Không thể upload văn bản');
      }
    } catch (error) {
      console.error('Error uploading text:', error);
      setMessage({ type: 'error', text: 'Không thể upload văn bản. Vui lòng thử lại.' });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadTextByUrl = async () => {
    if (!urlInput.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập URL' });
      return;
    }

    if (!urlSourceName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên tài liệu' });
      return;
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để upload tài liệu' });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/upload-url`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url: urlInput,
          source: urlSourceName
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'URL đã được upload thành công!' });
        setUrlInput('');
        setUrlSourceName('');
        // Reload to get real data
        loadDocuments();
        loadSources();
      } else {
        throw new Error('Không thể upload URL');
      }
    } catch (error) {
      console.error('Error uploading URL:', error);
      setMessage({ type: 'error', text: 'Không thể upload URL. Vui lòng thử lại.' });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadWebsite = async () => {
    if (!websiteUrl.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập URL website' });
      return;
    }

    if (!websiteSourceName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên nguồn' });
      return;
    }

    try {
      setIsUploadingWebsite(true);
      setWebsiteProgress([]);
      setMessage(null);
      setCurrentTaskId(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để crawl website' });
        return;
      }

      // Step 1: Start the crawl task
      const formData = new FormData();
      formData.append('website_url', websiteUrl);
      formData.append('source', websiteSourceName);

      const startResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/upload-website`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!startResponse.ok) {
        throw new Error(`HTTP error! status: ${startResponse.status}`);
      }

      const startResult = await startResponse.json();
      const taskId = startResult.task_id;
      
      if (!taskId) {
        throw new Error('Không nhận được task_id từ server');
      }

      setCurrentTaskId(taskId);
      setWebsiteProgress(prev => [...prev, `✅ Đã bắt đầu crawl website với task ID: ${taskId}`]);

      // Step 2: Stream progress using the task_id
      await streamProgress(taskId, token);

    } catch (error) {
      console.error('Error uploading website:', error);
      setMessage({ type: 'error', text: 'Không thể crawl website. Vui lòng thử lại.' });
      setIsUploadingWebsite(false);
      setCurrentTaskId(null);
    }
  };

  const streamProgress = async (taskId: string, token: string, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      console.log(`🔄 Starting stream for task ${taskId} (attempt ${retryCount + 1})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Stream timeout, aborting...');
        controller.abort();
      }, 300000); // 5 minutes timeout
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/sitemap-progress/${taskId}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        let lastMessageTime = Date.now();
        
        while (true) {
          try {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('📡 Stream ended normally');
              break;
            }
            
            lastMessageTime = Date.now();
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim() === '') continue; // Skip empty lines
              
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr === '') continue; // Skip empty data
                  
                  const data = JSON.parse(jsonStr);
                  console.log('📨 Received:', data);
                  
                  if (data.status === 'progress' || data.status === 'info') {
                    setWebsiteProgress(prev => [...prev, data.message]);
                  } else if (data.status === 'success') {
                    setWebsiteProgress(prev => [...prev, data.message]);
                    setMessage({ type: 'success', text: 'Website đã được crawl thành công!' });
                    setWebsiteUrl('');
                    setWebsiteSourceName('');
                    setCurrentTaskId(null);
                    setIsUploadingWebsite(false);
                    // Reload to get real data
                    loadDocuments();
                    loadSources();
                    return;
                  } else if (data.status === 'error') {
                    setMessage({ type: 'error', text: data.message });
                    setCurrentTaskId(null);
                    setIsUploadingWebsite(false);
                    return;
                  } else if (data.status === 'completed') {
                    // Task completed, stop streaming
                    console.log('✅ Task completed');
                    setWebsiteProgress(prev => [...prev, '✅ Crawl hoàn tất']);
                    setMessage({ type: 'success', text: 'Website đã được crawl thành công!' });
                    setWebsiteUrl('');
                    setWebsiteSourceName('');
                    setCurrentTaskId(null);
                    setIsUploadingWebsite(false);
                    loadDocuments();
                    loadSources();
                    return;
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e, 'Line:', line);
                }
              } else if (line.startsWith('event: ') || line.startsWith('id: ') || line.startsWith('retry: ')) {
                // Handle other SSE fields
                console.log('📋 SSE field:', line);
              }
            }
            
            // Check for connection timeout (no messages for 60 seconds)
            if (Date.now() - lastMessageTime > 60000) {
              console.log('⚠️ No messages for 60s, connection might be dead');
              throw new Error('Stream timeout - no messages received');
            }
            
          } catch (readError) {
            if (readError.name === 'AbortError') {
              console.log('🛑 Stream aborted');
              throw readError;
            }
            console.error('Read error:', readError);
            throw readError;
          }
        }
        
        // If we reach here, stream ended without completion
        console.log('⚠️ Stream ended without completion message');
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying stream (${retryCount + 1}/${maxRetries})`);
          setWebsiteProgress(prev => [...prev, `🔄 Kết nối bị gián đoạn, đang thử lại... (${retryCount + 1}/${maxRetries})`]);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          return streamProgress(taskId, token, retryCount + 1);
        } else {
          // If all retries failed, start polling as backup
          console.log('🔄 Stream failed, switching to polling backup');
          setWebsiteProgress(prev => [...prev, '🔄 Chuyển sang kiểm tra định kỳ...']);
          startPollingBackup(taskId, token);
        }
      }
    } catch (error) {
      console.error('Error streaming progress:', error);
      
      if (error.name === 'AbortError') {
        setMessage({ type: 'error', text: 'Stream bị timeout. Vui lòng kiểm tra lại tiến trình.' });
      } else if (retryCount < maxRetries) {
        console.log(`🔄 Retrying after error (${retryCount + 1}/${maxRetries})`);
        setWebsiteProgress(prev => [...prev, `❌ Lỗi kết nối, đang thử lại... (${retryCount + 1}/${maxRetries})`]);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s before retry
        return streamProgress(taskId, token, retryCount + 1);
      } else {
        setMessage({ type: 'error', text: 'Không thể theo dõi tiến trình sau nhiều lần thử. Vui lòng kiểm tra lại.' });
      }
    } finally {
      if (retryCount >= maxRetries || !currentTaskId) {
        setIsUploadingWebsite(false);
        setCurrentTaskId(null);
      }
    }
  };

  const startPollingBackup = (taskId: string, token: string) => {
    console.log('📊 Starting polling backup for task:', taskId);
    setWebsiteProgress(prev => [...prev, '📊 Bắt đầu kiểm tra định kỳ trạng thái...']);
    
    const interval = setInterval(async () => {
      try {
        console.log('🔍 Polling task status...');
        
        // Call the same progress endpoint but without streaming
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/sitemap-progress/${taskId}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json' // Request JSON instead of SSE
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Polling response:', data);
          
          if (data.status === 'completed' || data.status === 'success') {
            clearInterval(interval);
            setPollingInterval(null);
            setWebsiteProgress(prev => [...prev, '✅ Crawl hoàn tất (qua polling)']);
            setMessage({ type: 'success', text: 'Website đã được crawl thành công!' });
            setWebsiteUrl('');
            setWebsiteSourceName('');
            setCurrentTaskId(null);
            setIsUploadingWebsite(false);
            loadDocuments();
            loadSources();
          } else if (data.status === 'error' || data.status === 'failed') {
            clearInterval(interval);
            setPollingInterval(null);
            setMessage({ type: 'error', text: data.message || 'Crawl thất bại' });
            setCurrentTaskId(null);
            setIsUploadingWebsite(false);
          } else if (data.message) {
            // Still in progress, show latest message
            setWebsiteProgress(prev => {
              const newProgress = [...prev];
              if (newProgress[newProgress.length - 1] !== data.message) {
                newProgress.push(`📊 ${data.message}`);
              }
              return newProgress;
            });
          }
        } else {
          console.error('Polling failed:', response.status);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    setPollingInterval(interval);
    
    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPollingInterval(null);
      if (currentTaskId === taskId) {
        setMessage({ type: 'error', text: 'Timeout: Không thể hoàn thành crawl trong thời gian cho phép' });
        setCurrentTaskId(null);
        setIsUploadingWebsite(false);
      }
    }, 600000); // 10 minutes
  };

  const cancelCrawl = async () => {
    if (!currentTaskId) return;

    try {
      // Stop polling if it's running
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để hủy crawl' });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/cancel-crawl/${currentTaskId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Đã hủy tiến trình crawl website' });
        setWebsiteProgress(prev => [...prev, '❌ Tiến trình đã được hủy bởi người dùng']);
      } else {
        throw new Error('Không thể hủy tiến trình');
      }
    } catch (error) {
      console.error('Error canceling crawl:', error);
      setMessage({ type: 'error', text: 'Không thể hủy tiến trình. Vui lòng thử lại.' });
    } finally {
      setIsUploadingWebsite(false);
      setCurrentTaskId(null);
    }
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để upload file' });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/upload-file`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `File "${file.name}" đã được upload thành công!` });
        // Reload to get real data
        loadDocuments();
        loadSources();
      } else {
        throw new Error('Không thể upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: 'Không thể upload file. Vui lòng thử lại.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteDocumentsBySource = async (source: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tất cả tài liệu có nguồn "${source}"? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      // Optimistic update - remove documents with this source immediately
      const originalDocuments = [...documents];
      const originalSources = [...sources];
      // const documentsToRemove = documents.filter(doc => doc.source === source);
      const remainingDocuments = documents.filter(doc => doc.source !== source);
      const remainingSources = sources.filter(s => s !== source);
      
      setDocuments(remainingDocuments);
      setSources(remainingSources);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để xóa tài liệu' });
        // Restore on error
        setDocuments(originalDocuments);
        setSources(originalSources);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/delete-by-source?source=${encodeURIComponent(source)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Tất cả tài liệu có nguồn "${source}" đã được xóa thành công!` });
      } else {
        // Restore on error
        setDocuments(originalDocuments);
        setSources(originalSources);
        throw new Error('Không thể xóa tài liệu');
      }
    } catch (error) {
      console.error('Error deleting documents by source:', error);
      setMessage({ type: 'error', text: 'Không thể xóa tài liệu. Vui lòng thử lại.' });
    }
  };

  const viewSourceContent = async (source: string) => {
    try {
      setIsLoadingContent(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để xem nội dung' });
        return;
      }

      // Get document content by source
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents-original/list?source=${encodeURIComponent(source)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setViewingSource({ source, content: data.content || data.text || response.text || 'Không có nội dung' });
      } else {
        throw new Error('Không thể tải nội dung tài liệu');
      }
    } catch (error) {
      console.error('Error loading document content:', error);
      setMessage({ type: 'error', text: 'Không thể tải nội dung tài liệu. Vui lòng thử lại.' });
    } finally {
      setIsLoadingContent(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Tài Liệu</h2>
          <p className="text-gray-600">Tải lên tài liệu chứa các thông tin về của hàng của bạn, ví dụ: địa chỉ, các chính sách, hỗ trợ,...</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Thêm Tài Liệu Mới</h3>

          {/* Upload File - Centered Top */}
          <div className="mb-8 flex justify-center">
            <div className="w-full md:w-1/2 border border-gray-300 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900">Tải lên file</h4>
              <div className="space-y-3">
                <button
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Chọn file
                    </>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={uploadFile}
                  accept=".txt,.pdf,.doc,.docx"
                  className="hidden"
                />
                <p className="text-sm text-gray-500">
                  Hỗ trợ: .txt, .pdf, .doc, .docx
                </p>
              </div>
            </div>
          </div>

          {/* Upload Text & URL - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Text */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Tải lên văn bản</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={textSourceName}
                  onChange={(e) => setTextSourceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên tài liệu..."
                />
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập nội dung văn bản..."
                />
                <button
                  onClick={uploadText}
                  disabled={isUploading || !textInput.trim() || !textSourceName.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Tải lên văn bản
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Upload URL */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Tải lên URL</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={urlSourceName}
                  onChange={(e) => setUrlSourceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên tài liệu..."
                />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập URL..."
                />
                <button
                  onClick={uploadTextByUrl}
                  disabled={isUploading || !urlInput.trim() || !urlSourceName.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Tải lên URL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Website Crawling - Centered */}
          <div className="mt-8 flex justify-center">
            <div className="w-full md:w-1/2 border border-gray-300 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900">Lấy toàn bộ Website (áp dụng website có sitemap)</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={websiteSourceName}
                  onChange={(e) => setWebsiteSourceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Nhập tên nguồn..."
                />
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Nhập URL website (ví dụ: https://example.com)..."
                />
                {/* Button Group */}
                <div className="flex gap-2">
                  <button
                    onClick={uploadWebsite}
                    disabled={isUploadingWebsite || !websiteUrl.trim() || !websiteSourceName.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isUploadingWebsite ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang crawl website...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Crawl Website
                      </>
                    )}
                  </button>
                  
                  {/* Cancel Button - only show when crawling */}
                  {isUploadingWebsite && currentTaskId && (
                    <button
                      onClick={cancelCrawl}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Dừng
                    </button>
                  )}
                </div>
                
                {/* Progress Display */}
                {websiteProgress.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border max-h-40 overflow-y-auto">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Tiến trình:</h5>
                    <div className="space-y-1">
                      {websiteProgress.map((progress, index) => (
                        <div key={index} className="text-xs text-gray-600 font-mono">
                          {progress}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Documents List
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Danh Sách Tài Liệu ({isLoadingDocuments ? '...' : documents.length})
            </h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => { loadDocuments(); loadSources(); }}
                disabled={isLoadingDocuments || isLoadingSources}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center"
              >
                {(isLoadingDocuments || isLoadingSources) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tải...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Làm Mới
                  </>
                )}
              </button>
              <button
                onClick={deleteAllDocuments}
                disabled={isLoadingDocuments || documents.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa Tất Cả
              </button>
            </div>
          </div>

          {isLoadingDocuments ? (
            // Skeleton loading for documents
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                        <div className="w-32 h-4 bg-gray-300 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-4 bg-gray-300 rounded"></div>
                        <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
                        <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chưa có tài liệu nào. Hãy upload tài liệu đầu tiên!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc, index) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <FileText className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-500">
                          Tài liệu #{index + 1}
                          {doc.source && ` - ${doc.source}`}
                        </span>
                      </div>
                      <p className="text-gray-900 text-sm line-clamp-3">
                        {doc.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div> */}

        {/* Document Sources */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Nguồn Tài Liệu ({isLoadingSources ? '...' : sources.length})
          </h3>
          
          {isLoadingSources ? (
            // Skeleton loading for sources
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="ml-2 w-8 h-6 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có nguồn tài liệu nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 flex items-center">
                      <div className="mr-2 flex-shrink-0">
                        {getFileIcon(source)}
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm truncate" title={source}>
                        {source}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => viewSourceContent(source)}
                        disabled={isLoadingContent}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                        title={`Xem nội dung "${source}"`}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteDocumentsBySource(source)}
                        disabled={isLoadingDocuments}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50"
                        title={`Xóa tất cả tài liệu từ nguồn "${source}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Content Modal */}
        {viewingSource && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Nội dung: {viewingSource.source}
                </h3>
                <button
                  onClick={() => setViewingSource(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingContent ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Đang tải nội dung...</span>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                      {viewingSource.content}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setViewingSource(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsTab; 