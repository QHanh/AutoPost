import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, RefreshCw, Plus, File, Download, AlertTriangle } from 'lucide-react';

interface Document {
  id: string;
  text: string;
  source?: string;
}

const DocumentsTab: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load data immediately without blocking UI
    loadDocuments();
    loadSources();
  }, []);

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

    try {
      setIsUploading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để upload tài liệu' });
        return;
      }

      // Optimistic update - add temporary document
      const tempDoc: Document = {
        id: `temp-${Date.now()}`,
        text: textInput,
        source: `Text Upload - ${new Date().toLocaleString('vi-VN')}`
      };
      setDocuments(prev => [tempDoc, ...prev]);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/upload-text`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: textInput,
          source: `Text Upload - ${new Date().toLocaleString('vi-VN')}`
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Văn bản đã được upload thành công!' });
        setTextInput('');
        setShowTextInput(false);
        // Reload to get real data
        loadDocuments();
        loadSources();
      } else {
        // Remove temporary document on error
        setDocuments(prev => prev.filter(doc => doc.id !== tempDoc.id));
        throw new Error('Không thể upload văn bản');
      }
    } catch (error) {
      console.error('Error uploading text:', error);
      setMessage({ type: 'error', text: 'Không thể upload văn bản. Vui lòng thử lại.' });
    } finally {
      setIsUploading(false);
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

      // Optimistic update - add temporary document
      const tempDoc: Document = {
        id: `temp-${Date.now()}`,
        text: `Đang xử lý file: ${file.name}`,
        source: `File Upload - ${file.name} - ${new Date().toLocaleString('vi-VN')}`
      };
      setDocuments(prev => [tempDoc, ...prev]);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', `File Upload - ${file.name} - ${new Date().toLocaleString('vi-VN')}`);

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
        // Remove temporary document on error
        setDocuments(prev => prev.filter(doc => doc.id !== tempDoc.id));
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

  const deleteAllDocuments = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa TẤT CẢ tài liệu? Hành động này không thể hoàn tác!')) {
      return;
    }

    try {
      // Optimistic update - clear documents immediately
      const originalDocuments = [...documents];
      const originalSources = [...sources];
      setDocuments([]);
      setSources([]);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để xóa tài liệu' });
        // Restore on error
        setDocuments(originalDocuments);
        setSources(originalSources);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/delete-all`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Tất cả tài liệu đã được xóa thành công!' });
      } else {
        // Restore on error
        setDocuments(originalDocuments);
        setSources(originalSources);
        throw new Error('Không thể xóa tài liệu');
      }
    } catch (error) {
      console.error('Error deleting documents:', error);
      setMessage({ type: 'error', text: 'Không thể xóa tài liệu. Vui lòng thử lại.' });
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
      const documentsToRemove = documents.filter(doc => doc.source === source);
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Tài Liệu</h2>
          <p className="text-gray-600">Quản lý tài liệu và dữ liệu vector cho chatbot AI</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Text */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Upload Văn Bản</h4>
                <button
                  onClick={() => setShowTextInput(!showTextInput)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {showTextInput ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              
              {showTextInput && (
                <div className="space-y-3">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập nội dung văn bản..."
                  />
                  <button
                    onClick={uploadText}
                    disabled={isUploading || !textInput.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang Upload...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Upload Văn Bản
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Upload File */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Upload File</h4>
              <button
                onClick={triggerFileInput}
                disabled={isUploading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang Upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Chọn File
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

        {/* Documents List */}
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
        </div>

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
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm truncate" title={source}>
                        {source}
                      </h4>
                    </div>
                    <button
                      onClick={() => deleteDocumentsBySource(source)}
                      disabled={isLoadingDocuments}
                      className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50"
                      title={`Xóa tất cả tài liệu từ nguồn "${source}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab; 