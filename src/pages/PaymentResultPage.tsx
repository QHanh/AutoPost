import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export const PaymentResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const statusParam = searchParams.get('status');
        const code = searchParams.get('code');
        const msg = searchParams.get('message');

        if (statusParam === 'success') {
            setStatus('success');
            setMessage('Thanh toán thành công! Gói dịch vụ của bạn đã được kích hoạt.');
        } else if (statusParam === 'failed') {
            setStatus('failed');
            setMessage(`Thanh toán thất bại (Mã lỗi: ${code}). Vui lòng thử lại.`);
        } else if (statusParam === 'error') {
            setStatus('error');
            setMessage(msg || 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng liên hệ hỗ trợ.');
        } else {
            setStatus('error');
            setMessage('Trạng thái không hợp lệ.');
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                {status === 'success' && (
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
                        <p className="text-gray-600">{message}</p>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="text-red-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h2>
                        <p className="text-gray-600">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="text-yellow-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Đã có lỗi xảy ra</h2>
                        <p className="text-gray-600">{message}</p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/pricing')}
                        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                        Về trang bảng giá
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        Về trang chủ
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
