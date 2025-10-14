import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Edit, Search, MessageCircle, Check, X, Upload, Download, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import { faqMobileService, FaqItem, FaqCreate } from '../../services/faqMobileService';


interface FaqMobileTabProps {
  currentPage?: number;
  currentLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const FaqMobileTab: React.FC<FaqMobileTabProps> = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFaq, setNewFaq] = useState<FaqCreate>({ classification: '', question: '', answer: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<FaqCreate>({ classification: '', question: '', answer: '' });
  const [newFaqImages, setNewFaqImages] = useState<File[]>([]);
  const [editingImages, setEditingImages] = useState<File[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter FAQs based on search term
  const filteredFaqs = faqs.filter(faq =>
    (faq.classification || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (faq.question || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (faq.answer || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch FAQs from API
  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const faqs = await faqMobileService.getAllFaqs();
      setFaqs(faqs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error instanceof Error ? error.message : 'Không thể tải danh sách FAQ. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // Handle add new FAQ
  const handleAddFaq = async () => {
    if (!(newFaq.classification || '').trim() || !(newFaq.question || '').trim() || !(newFaq.answer || '').trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Thông báo',
        text: 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời.',
      });
      return;
    }

    setLoading(true);
    try {
      const faqData = { ...newFaq, images: newFaqImages.length > 0 ? newFaqImages : undefined };
      await faqMobileService.addFaq(faqData);
      await fetchFaqs();
      setNewFaq({ classification: '', question: '', answer: '' });
      setNewFaqImages([]);
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'FAQ đã được thêm mới!',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error adding FAQ:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error instanceof Error ? error.message : 'Không thể thêm FAQ. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle update FAQ
  const handleUpdateFaq = async (faqId: string) => {
    if (!(editingData.classification || '').trim() || !(editingData.question || '').trim() || !(editingData.answer || '').trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Thông báo',
        text: 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời.',
      });
      return;
    }

    setLoading(true);
    try {
      const faqData = { ...editingData, images: editingImages.length > 0 ? editingImages : undefined };
      await faqMobileService.updateFaq(faqId, faqData);
      await fetchFaqs();
      setEditingId(null);
      setEditingData({ classification: '', question: '', answer: '' });
      setEditingImages([]);
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'FAQ đã được cập nhật!',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error updating FAQ:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error instanceof Error ? error.message : 'Không thể cập nhật FAQ. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete FAQ
  const handleDelete = async (faqId: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa FAQ này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await faqMobileService.deleteFaq(faqId);
        await fetchFaqs();
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa',
          text: 'FAQ đã được xóa thành công!',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error instanceof Error ? error.message : 'Không thể xóa FAQ. Vui lòng thử lại.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle delete all FAQs
  const handleDeleteAll = async () => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa tất cả',
      text: 'Bạn có chắc chắn muốn xóa TẤT CẢ FAQ? Hành động này không thể hoàn tác!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa tất cả',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await faqMobileService.deleteAllFaqs();
        await fetchFaqs();
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa',
          text: 'Tất cả FAQ đã được xóa thành công!',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error deleting all FAQs:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error instanceof Error ? error.message : 'Không thể xóa tất cả FAQ. Vui lòng thử lại.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle edit mode
  const handleEdit = (faq: FaqItem) => {
    setEditingId(faq.faq_id);
    setEditingData({ 
      classification: faq.classification || '', 
      question: faq.question || '', 
      answer: faq.answer || '' 
    });
    setEditingImages([]);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({ classification: '', question: '', answer: '' });
    setEditingImages([]);
  };

  // Handle import FAQ from file
  const handleImportFaq = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng chọn file Excel (.xlsx hoặc .xls)',
      });
      return;
    }

    setImportLoading(true);
    try {
      const result = await faqMobileService.importFaqFromFile(file);
      await fetchFaqs();
      
      Swal.fire({
        icon: 'success',
        title: 'Import thành công!',
        html: `
          <p>Đã import FAQ thành công:</p>
          <p><strong>Thành công:</strong> ${result.data?.successfully_indexed || 0} mục</p>
          <p><strong>Thất bại:</strong> ${result.data?.failed_items?.length || 0} mục</p>
        `,
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error importing FAQ:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error instanceof Error ? error.message : 'Không thể import FAQ. Vui lòng thử lại.',
      });
    } finally {
      setImportLoading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle export FAQ to Excel
  const handleExportFaq = async () => {
    setExportLoading(true);
    try {
      const blob = await faqMobileService.exportFaqToExcel();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faq_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Export thành công!',
        text: 'File Excel đã được tải xuống.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error exporting FAQ:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error instanceof Error ? error.message : 'Không thể export FAQ. Vui lòng thử lại.',
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle new FAQ images upload
  const handleNewFaqImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setNewFaqImages(files);
  };

  // Handle editing FAQ images upload
  const handleEditingImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setEditingImages(files);
  };

  // Remove image from new FAQ
  const removeNewFaqImage = (index: number) => {
    setNewFaqImages(prev => prev.filter((_, i) => i !== index));
  };

  // Remove image from editing FAQ
  const removeEditingImage = (index: number) => {
    setEditingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Parse comma-separated image URLs
  const parseImageUrls = (imageString?: string): string[] => {
    if (!imageString) return [];
    return imageString.split(',').map(url => url.trim()).filter(url => url.length > 0);
  };

  // Render images component
  const renderImages = (imageString?: string, isEditing: boolean = false, files: File[] = [], onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void, onRemove?: (index: number) => void) => {
    const imageUrls = parseImageUrls(imageString);
    
    if (isEditing) {
      return (
        <div className="flex flex-col items-center space-y-2">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onChange}
            className="text-xs"
          />
          {/* Show current images */}
          {imageUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Current FAQ ${index + 1}`}
                className="w-16 h-16 object-cover rounded border"
              />
            </div>
          ))}
          {/* Show new uploaded files */}
          {files.map((file, index) => (
            <div key={`new-${index}`} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`New preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded border"
              />
              <button
                onClick={() => onRemove?.(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (imageUrls.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {imageUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`FAQ ${index + 1}`}
              className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
              onClick={() => window.open(url, '_blank')}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý câu hỏi thường gặp</h1>
              <p className="text-gray-600">Quản lý câu hỏi thường gặp cho ứng dụng mobile</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Import Button */}
            <button
              onClick={triggerFileInput}
              disabled={importLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{importLoading ? 'Đang import...' : 'Import Excel'}</span>
            </button>

            {/* Export Button */}
            <button
              onClick={handleExportFaq}
              disabled={exportLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{exportLoading ? 'Đang export...' : 'Export Excel'}</span>
            </button>

            {/* Delete All Button */}
            {faqs.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm kiếm FAQ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Hidden File Input for Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportFaq}
          style={{ display: 'none' }}
        />
      </div>

      {/* FAQ Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Phân loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Câu hỏi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Câu trả lời
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Hình ảnh
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Add new FAQ row - always first */}
                <tr className="bg-blue-50">
                  <td className="px-6 py-4">
                    <textarea
                      value={newFaq.classification}
                      onChange={(e) => setNewFaq({ ...newFaq, classification: e.target.value })}
                      placeholder="Nhập phân loại mới..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <textarea
                      value={newFaq.question}
                      onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                      placeholder="Nhập câu hỏi mới..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <textarea
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                      placeholder="Nhập câu trả lời..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleNewFaqImagesChange}
                        className="text-xs"
                      />
                      {newFaqImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <button
                            onClick={() => removeNewFaqImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={handleAddFaq}
                      disabled={!(newFaq.classification || '').trim() || !(newFaq.question || '').trim() || !(newFaq.answer || '').trim() || loading}
                      className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                
                {/* Existing FAQs */}
                {filteredFaqs.map((faq) => (
                  <tr key={faq.faq_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {editingId === faq.faq_id ? (
                        <textarea
                          value={editingData.classification}
                          onChange={(e) => setEditingData({ ...editingData, classification: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 whitespace-pre-wrap">{faq.classification || ''}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === faq.faq_id ? (
                        <textarea
                          value={editingData.question}
                          onChange={(e) => setEditingData({ ...editingData, question: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 whitespace-pre-wrap">{faq.question || ''}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === faq.faq_id ? (
                        <textarea
                          value={editingData.answer}
                          onChange={(e) => setEditingData({ ...editingData, answer: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{faq.answer || ''}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingId === faq.faq_id ? (
                        renderImages(faq.image, true, editingImages, handleEditingImagesChange, removeEditingImage)
                      ) : (
                        renderImages(faq.image)
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {editingId === faq.faq_id ? (
                          <>
                            <button
                              onClick={() => handleUpdateFaq(faq.faq_id)}
                              disabled={!(editingData.classification || '').trim() || !(editingData.question || '').trim() || !(editingData.answer || '').trim() || loading}
                              className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Lưu"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="inline-flex items-center px-2 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                              title="Hủy"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(faq)}
                              className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(faq.faq_id)}
                              className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Empty state when no FAQs */}
                {filteredFaqs.length === 0 && !searchTerm && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">Chưa có FAQ nào</p>
                        <p className="text-sm">Sử dụng dòng đầu tiên để thêm FAQ mới</p>
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* No search results */}
                {filteredFaqs.length === 0 && searchTerm && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">Không tìm thấy FAQ nào</p>
                        <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaqMobileTab;
