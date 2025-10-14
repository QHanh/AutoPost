import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Plus, Copy, X, Check } from 'lucide-react';
import { faqMobileService } from '../services/faqMobileService';
import Swal from 'sweetalert2';

interface MessageActionDropdownProps {
  messageText: string;
  isVisible: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const MessageActionDropdown: React.FC<MessageActionDropdownProps> = ({
  messageText,
  isVisible,
  onToggle,
  onClose
}) => {
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [isSavingFaq, setIsSavingFaq] = useState(false);

  // Close dropdown when clicking outside or pressing Escape
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isVisible) return;
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  const handleAddToFaq = () => {
    setFaqQuestion(messageText);
    setFaqAnswer('');
    setShowFaqForm(true);
    onClose();
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      Swal.fire({
        icon: 'success',
        title: 'Đã sao chép',
        text: 'Nội dung đã được sao chép vào clipboard!',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể sao chép nội dung.',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
    onClose();
  };

  const handleSaveFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Thông báo',
        text: 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời.',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setIsSavingFaq(true);
    try {
      // Create FAQ data without image for chat interface
      const faqData = {
        classification: 'chatbot',
        question: faqQuestion,
        answer: faqAnswer
        // No images field - this is for chat interface only
      };
      
      await faqMobileService.addFaq(faqData);
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'FAQ đã được thêm thành công!',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
      setShowFaqForm(false);
      setFaqQuestion('');
      setFaqAnswer('');
    } catch (error) {
      console.error('Error adding FAQ:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Có lỗi xảy ra khi thêm FAQ.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } finally {
      setIsSavingFaq(false);
    }
  };

  const handleCancelFaq = () => {
    setShowFaqForm(false);
    setFaqQuestion('');
    setFaqAnswer('');
  };

  return (
    <>
      {/* Dropdown Menu */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Thao tác"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {isVisible && (
          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
            <button
              onClick={handleAddToFaq}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 rounded-t-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm vào FAQ</span>
            </button>
            <button
              onClick={handleCopyMessage}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 rounded-b-lg"
            >
              <Copy className="h-4 w-4" />
              <span>Sao chép</span>
            </button>
          </div>
        )}
      </div>

      {/* FAQ Form Modal */}
      {showFaqForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Thêm FAQ</h3>
                <button
                  onClick={handleCancelFaq}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Câu hỏi
                  </label>
                  <textarea
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Nhập câu hỏi..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Câu trả lời
                  </label>
                  <textarea
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Nhập câu trả lời..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelFaq}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isSavingFaq}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveFaq}
                  disabled={isSavingFaq}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors flex items-center space-x-2"
                >
                  {isSavingFaq ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Lưu FAQ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageActionDropdown;
