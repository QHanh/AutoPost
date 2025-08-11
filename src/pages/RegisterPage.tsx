import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    verificationCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [step, setStep] = useState(1); // 1 for email input, 2 for verification and other details
  const [isSendingCode, setIsSendingCode] = useState(false);

  const { register, sendVerificationCode } = useAuth();
  const navigate = useNavigate();

  const validateEmail = () => {
    if (!formData.email.trim()) {
      return 'Vui lòng nhập email.';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Email không hợp lệ.';
    }
    
    return null;
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      return 'Vui lòng nhập họ và tên.';
    }
    
    if (formData.full_name.trim().length < 2) {
      return 'Họ và tên phải có ít nhất 2 ký tự.';
    }
    
    if (!formData.password) {
      return 'Vui lòng nhập mật khẩu.';
    }
    
    if (formData.password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự.';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }
    
    if (!formData.verificationCode.trim()) {
      return 'Vui lòng nhập mã xác thực.';
    }
    
    return null;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateEmail();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setIsSendingCode(true);
    setMessage(null);

    const result = await sendVerificationCode(formData.email);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      // Move to step 2 after successful email verification
      setTimeout(() => {
        setStep(2);
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setIsSendingCode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const result = await register(formData.email, formData.password, formData.full_name, formData.verificationCode);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear message when user starts typing
    if (message) setMessage(null);
  };

  const handleBackToEmail = () => {
    setStep(1);
    setMessage(null);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/google/login`);
      if (!response.ok) {
        throw new Error('Failed to get Google auth URL');
      }
      const data = await response.json();
      window.location.href = data.authorization_url;
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể đăng nhập bằng Google. Vui lòng thử lại.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <UserPlus className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký tài khoản</h2>
          <p className="text-gray-600">Tạo tài khoản để bắt đầu sử dụng Social Hub</p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={step === 1 ? handleSendCode : handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.type === 'success' ? 
                  <CheckCircle className="flex-shrink-0" size={20} /> : 
                  <AlertCircle className="flex-shrink-0" size={20} />
                }
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {step === 1 ? (
              // Step 1: Email input and send verification code
              <>
                <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Bước 1: Xác thực email</h3>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Send Code Button */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSendingCode}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isSendingCode ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Đang gửi mã...
                      </>
                    ) : (
                      <>
                        <Mail size={20} />
                        Gửi mã xác thực
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              // Step 2: Verification code and other details
              <>
                <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Bước 2: Hoàn tất đăng ký</h3>
                
                {/* Back to email step */}
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="mb-4 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  ← Quay lại
                </button>
                
                {/* Email (read-only) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Verification Code */}
                <div className="mb-4">
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Mã xác thực *
                  </label>
                  <div className="relative">
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      required
                      value={formData.verificationCode}
                      onChange={handleChange}
                      className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nhập mã xác thực đã nhận"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.</p>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ít nhất 8 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Mật khẩu phải có ít nhất 8 ký tự.</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Đang đăng ký...
                      </>
                    ) : (
                      <>
                        <UserPlus size={20} />
                        Đăng ký
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-semibold text-lg border border-gray-300 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <img src="/google-logo.svg" alt="Google logo" className="w-6 h-6" />
            Đăng ký với Google
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              ← Quay về trang chủ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};