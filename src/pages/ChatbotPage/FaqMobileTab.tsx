import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Search, MessageCircle, HelpCircle, Save, X } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [formData, setFormData] = useState<FaqCreate>({ question: '', answer: '' });

  // Filter FAQs based on search term
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Thông báo',
        text: 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời.',
      });
      return;
    }

    setLoading(true);
    try {
      if (editingFaq) {
        await faqMobileService.updateFaq(editingFaq.faq_id, formData);
      } else {
        await faqMobileService.addFaq(formData);
      }
      
      await fetchFaqs();
      setIsModalOpen(false);
      setEditingFaq(null);
      setFormData({ question: '', answer: '' });
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: editingFaq ? 'FAQ đã được cập nhật!' : 'FAQ đã được thêm mới!',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error saving FAQ:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error instanceof Error ? error.message : 'Không thể lưu FAQ. Vui lòng thử lại.',
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

  // Open edit modal
  const handleEdit = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer });
    setIsModalOpen(true);
  };

  // Open add modal
  const handleAdd = () => {
    setEditingFaq(null);
    setFormData({ question: '', answer: '' });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFaq(null);
    setFormData({ question: '', answer: '' });
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
              <h1 className="text-2xl font-bold text-gray-900">Quản lý FAQ Mobile</h1>
              <p className="text-gray-600">Quản lý câu hỏi thường gặp cho ứng dụng mobile</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm FAQ</span>
            </button>
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
      </div>

      {/* FAQ List */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Không tìm thấy FAQ nào' : 'Chưa có FAQ nào'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Thử tìm kiếm với từ khóa khác' 
                : 'Bắt đầu bằng cách thêm FAQ đầu tiên của bạn'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm FAQ đầu tiên</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFaqs.map((faq, index) => (
              <div key={faq.faq_id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        FAQ #{index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-start">
                      <HelpCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      {faq.question}
                    </h3>
                    <div className="text-gray-700 bg-gray-50 rounded-lg p-4">
                      <div className="whitespace-pre-wrap">{faq.answer}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.faq_id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingFaq ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Nhập câu hỏi..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Câu trả lời <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Nhập câu trả lời..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingFaq ? 'Cập nhật' : 'Thêm mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqMobileTab;
