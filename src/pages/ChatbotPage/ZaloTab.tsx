import React, { useState, useEffect } from 'react';
import { QrCode, Smartphone, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { zaloLoginQRStream, getZaloStatus, QRResponse } from '../../services/zaloService';

interface ZaloTabProps {
  currentPage?: number;
  currentLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}


const ZaloTab: React.FC<ZaloTabProps> = () => {
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<string>('idle');
  const [message, setMessage] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);

  const getStatusIcon = () => {
    switch (status) {
      case 'QRCodeGenerated':
        return <QrCode className="text-blue-500" size={20} />;
      case 'QRCodeScanned':
        return <Smartphone className="text-yellow-500" size={20} />;
      case 'GotLoginInfo':
      case 'SessionSaved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'QRCodeExpired':
      case 'QRCodeDeclined':
      case 'SessionSaveError':
        return <XCircle className="text-red-500" size={20} />;
      case 'connecting':
        return <Clock className="text-blue-500 animate-spin" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'QRCodeGenerated':
        return 'Mã QR đã được tạo. Vui lòng quét bằng ứng dụng Zalo.';
      case 'QRCodeScanned':
        return 'Mã QR đã được quét. Vui lòng xác nhận trên điện thoại.';
      case 'GotLoginInfo':
        return 'Đã nhận thông tin đăng nhập. Đang lưu phiên...';
      case 'SessionSaved':
        return 'Đăng nhập thành công! Phiên đã được lưu.';
      case 'QRCodeExpired':
        return 'Mã QR đã hết hạn. Vui lòng tạo mã mới.';
      case 'QRCodeDeclined':
        return 'Đăng nhập bị từ chối. Vui lòng thử lại.';
      case 'SessionSaveError':
        return `Lỗi khi lưu phiên: ${message}`;
      case 'connecting':
        return 'Đang kết nối...';
      case 'idle':
        return 'Nhấn "Tạo mã QR" để bắt đầu đăng nhập Zalo.';
      default:
        return message || 'Trạng thái không xác định.';
    }
  };

  const handleSSEMessage = (data: QRResponse) => {
    setStatus(data.type);
    
    switch (data.type) {
      case 'QRCodeGenerated':
        if (data.data?.image) {
          setQrCode(`data:image/png;base64,${data.data.image}`);
        }
        break;
      case 'SessionSaved':
        setMessage(`UID: ${data.uid}, Session Key: ${data.session_key}`);
        setTimeout(() => {
          setIsConnecting(false);
        }, 3000);
        break;
      case 'SessionSaveError':
        {
          const errMsg = (data.error || '').toLowerCase();
          // Some zca-js internal errors like 'checkUpdate' during getOwnId are benign for our UX.
          const benign = errMsg.includes('checkupdate') || errMsg.includes('logincookie');
          if (benign) {
            setStatus('SessionSaved');
            setMessage('Đăng nhập thành công! (Có cảnh báo nội bộ, bỏ qua)');
            setTimeout(() => {
              setIsConnecting(false);
            }, 3000);
          } else {
            setMessage(data.error || 'Lỗi không xác định');
            setTimeout(() => {
              setIsConnecting(false);
            }, 3000);
          }
          break;
        }
      case 'QRCodeExpired':
      case 'QRCodeDeclined':
        setTimeout(() => {
          setIsConnecting(false);
        }, 3000);
        break;
    }
  };

  const connectToZalo = async () => {
    if (eventSource) {
      eventSource.close();
    }

    setIsConnecting(true);
    setStatus('connecting');
    setQrCode('');
    setMessage('');

    try {
      await zaloLoginQRStream(
        handleSSEMessage,
        (error: Error) => {
          console.error('Error connecting to Zalo:', error);
          setStatus('error');
          setMessage(error.message || 'Lỗi kết nối');
          setIsConnecting(false);
        },
        () => {
          // Stream completed
          console.log('Zalo stream completed');
        }
      );
    } catch (error: any) {
      console.error('Error connecting to Zalo:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Lỗi kết nối');
      setIsConnecting(false);
    }
  };

  const disconnectFromZalo = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsConnecting(false);
    setStatus('idle');
    setQrCode('');
    setMessage('');
  };

  // Kiểm tra trạng thái phiên Zalo khi mở tab
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await getZaloStatus();
        if (!mounted) return;
        if (status?.ok && (status.exists === true || status.exists === 'true')) {
          setStatus('SessionSaved');
          setMessage(`Đã kết nối. UID: ${status.account_id || 'N/A'}`);
        } else {
          setStatus('idle');
        }
      } catch (e) {
        // Không chặn UI khi lỗi kiểm tra trạng thái
        setStatus('idle');
      } finally {
        if (mounted) setIsCheckingStatus(false);
      }
    })();
    return () => {
      mounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng nhập Zalo</h2>
        <p className="text-gray-600">
          Kết nối tài khoản Zalo của bạn để sử dụng các tính năng chatbot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
            {qrCode ? (
              <div className="space-y-4">
                <img 
                  src={qrCode} 
                  alt="Zalo QR Code" 
                  className="mx-auto max-w-full h-auto border rounded-lg shadow-sm"
                />
                <p className="text-sm text-gray-600">
                  Quét mã QR bằng ứng dụng Zalo trên điện thoại
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <QrCode size={64} className="text-gray-400 mx-auto" />
                <p className="text-gray-500">
                  Mã QR sẽ hiển thị ở đây
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={connectToZalo}
              disabled={isConnecting || isCheckingStatus}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isCheckingStatus ? 'Đang kiểm tra trạng thái...' : (isConnecting ? 'Đang kết nối...' : 'Tạo mã QR')}
            </button>
            
            {isConnecting && (
              <button
                onClick={disconnectFromZalo}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
            )}
          </div>
        </div>

        {/* Status Section */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Trạng thái kết nối</h3>
            
            <div className="flex items-center space-x-3 mb-3">
              {getStatusIcon()}
              <span className="font-medium text-gray-700 capitalize">
                {status === 'idle' ? 'Chưa kết nối' : status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              {getStatusMessage()}
            </p>
            
            {message && status !== 'SessionSaveError' && (
              <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                <p className="text-sm text-blue-700">{message}</p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Hướng dẫn:</h4>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Nhấn "Tạo mã QR" để bắt đầu</li>
              <li>Mở ứng dụng Zalo trên điện thoại</li>
              <li>Quét mã QR hiển thị trên màn hình</li>
              <li>Xác nhận đăng nhập trên điện thoại</li>
              <li>Chờ hệ thống lưu thông tin phiên</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZaloTab;
