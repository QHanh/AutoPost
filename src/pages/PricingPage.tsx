// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Check, X, Star, Zap, Crown, Rocket, Gift, Bot, Video } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';

// --- TYPE DEFINITIONS ---
interface VideoPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  max_videos_per_day: number;
  max_scheduled_days: number;
  max_stored_videos: number;
  storage_limit_gb: number;
  max_social_accounts: number;
  ai_content_generation: boolean;
  is_active: boolean;
}

interface ChatbotService {
    id: string;
    name: string;
    description: string;
    base_price: number;
}

interface ChatbotPlan {
    id: string;
    name: string;
    description: string;
    monthly_price: number;
    services: ChatbotService[];
}

interface VideoSubscription {
  id: string;
  plan: VideoPlan; // Dữ liệu trả về từ API có cấu trúc lồng nhau
  subscription_plan: VideoPlan;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface ChatbotSubscription {
    id: string;
    plan: ChatbotPlan;
    start_date: string;
    end_date: string;
    is_active: boolean;
    months_subscribed: number;
    total_price: number;
}

interface MySubscriptions {
    video_subscription: VideoSubscription | null;
    chatbot_subscription: ChatbotSubscription | null;
}

type Plan = VideoPlan | ChatbotPlan;


// A simple API client using fetch
const api = {
  get: async <T,>(url: string, token?: string | null): Promise<{ data: T }> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}${url}`, { headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.detail || errorData.message || 'An unknown error occurred');
    }

    const data = await response.json();
    return { data };
  },

  post: async <T, U>(url: string, body: U, token?: string | null): Promise<{ data: T; status: number }> => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const responseData = await response.json().catch(() => null);

    if (![200, 201].includes(response.status)) { // Chấp nhận cả 200 và 201
        const errorMessage = responseData?.detail || responseData?.message || `Lỗi máy chủ: ${response.statusText}`;
        throw new Error(errorMessage);
    }
    
    return { data: responseData, status: response.status };
  },
};


// --- UI HELPER FUNCTIONS ---

const getVideoPlanUIDetails = (planName: string) => {
  switch (planName) {
    case "Miễn phí":
      return {
        icon: <Gift className="text-pink-600/70 drop-shadow-[0_0_2px_rgba(0,0,0,0.25)]" size={24} />,
        color: "border-gray-300",
        bgColor: "bg-gray-50",
        textColor: "text-gray-900",
        buttonColor: "bg-gray-700 text-white hover:bg-gray-800",
        popular: false,
      };
    case "Tiết kiệm":
      return {
        icon: <Crown className="text-purple-600" size={24} />,
        color: "border-purple-500",
        bgColor: "bg-purple-50",
        textColor: "text-purple-900",
        buttonColor: "bg-purple-600 text-white hover:bg-purple-700",
        popular: true,
      };
    case "Chuyên nghiệp":
      return {
        icon: <Rocket className="text-green-600" size={24} />,
        color: "border-green-500",
        bgColor: "bg-green-50",
        textColor: "text-green-900",
        buttonColor: "bg-green-600 text-white hover:bg-green-700",
        popular: false,
      };
    case "Cơ bản":
    default:
      return {
        icon: <Zap className="text-blue-600" size={24} />,
        color: "border-blue-200",
        bgColor: "bg-blue-50",
        textColor: "text-blue-900",
        buttonColor: "bg-blue-600 text-white hover:bg-blue-700",
        popular: false,
      };
  }
};

const getChatbotPlanUIDetails = (planName: string) => {
    // Tạm thời dùng chung, có thể tùy chỉnh sau
    return getVideoPlanUIDetails(planName);
}

const formatPrice = (price: number) => {
  if (price === 0) return "0đ";
  return `${(price / 1000).toLocaleString('de-DE')}K`;
};

const formatDuration = (plan: Plan) => {
    if ('duration_days' in plan) { // It's a VideoPlan
        if (plan?.name === 'Chuyên nghiệp') return '/ năm';
        if (plan?.duration_days >= 90) return `/ ${plan.duration_days / 30} tháng`;
        if (plan?.duration_days >= 30) return '/ tháng';
        return `/ ${plan?.duration_days || 0} ngày`;
    }
    if ('monthly_price' in plan) { // It's a ChatbotPlan
        return '/ tháng';
    }
    return '';
};


export const PricingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [serviceType, setServiceType] = useState<'video' | 'chatbot'>('video');

  const [videoPlans, setVideoPlans] = useState<VideoPlan[]>([]);
  const [chatbotPlans, setChatbotPlans] = useState<ChatbotPlan[]>([]);

  const [currentSubs, setCurrentSubs] = useState<MySubscriptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State để quản lý modal QR và trạng thái đang đăng ký
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(1);


  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        setLoading(true);
        const videoPlansPromise = api.get<VideoPlan[]>('/api/v1/subscriptions/plans', token);
        const chatbotPlansPromise = api.get<ChatbotPlan[]>('/api/v1/chatbot-subscriptions/plans', token);
        
        const promises: [Promise<any>, Promise<any>, Promise<any> | null] = [videoPlansPromise, chatbotPlansPromise, null];
        if (isAuthenticated && token) {
          promises[2] = api.get<MySubscriptions>('/api/v1/subscriptions/me', token);
        }

        const [videoPlansResponse, chatbotPlansResponse, currentSubsResponse] = await Promise.all(promises);

        // Process Video Plans
        if (videoPlansResponse && Array.isArray(videoPlansResponse.data)) {
          const sortedPlans = videoPlansResponse.data
            .filter((p: VideoPlan) => p && p.is_active)
            .sort((a: VideoPlan, b: VideoPlan) => (a.price || 0) - (b.price || 0));
          setVideoPlans(sortedPlans);
        } else {
          throw new Error("Dữ liệu bảng giá Video trả về không hợp lệ.");
        }

        // Process Chatbot Plans
        if (chatbotPlansResponse && Array.isArray(chatbotPlansResponse.data)) {
            // FIX: Filter out any null/undefined plans from the API response
            setChatbotPlans(chatbotPlansResponse.data.filter(p => p).sort((a,b) => a.monthly_price - b.monthly_price));
        } else {
            throw new Error("Dữ liệu bảng giá Chatbot trả về không hợp lệ.");
        }
        
        // Process Subscriptions
        if (currentSubsResponse && currentSubsResponse.data) {
          setCurrentSubs(currentSubsResponse.data);
        }
        
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu bảng giá.");
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const handleSelectPlan = async (plan: Plan) => {
    const token = localStorage.getItem('auth_token');

    if (!isAuthenticated || !token) {
        Swal.fire({
            title: 'Yêu cầu đăng nhập',
            text: 'Bạn cần đăng nhập hoặc đăng ký để chọn gói cước.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đăng nhập',
            cancelButtonText: 'Để sau',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                // Chuyển hướng đến trang đăng nhập
                window.location.href = '/login';
            }
        });
        return;
    }

    if (('price' in plan && plan.price === 0)) {
      Swal.fire('Gói Miễn phí', 'Bạn không cần thanh toán cho gói miễn phí.', 'info');
      return;
    }

    const confirmation = await Swal.fire({
        title: 'Xác nhận chọn gói',
        html: `Bạn có chắc chắn muốn đăng ký <b>Gói ${plan.name}</b> không?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        reverseButtons: true
    });

    if (confirmation.isConfirmed) {
        setIsSubscribing(plan.id);
        try {
          let response;
          if (serviceType === 'video' && 'duration_days' in plan) {
              response = await api.post(
                '/api/v1/subscriptions/',
                { subscription_id: plan.id },
                token
              );
          } else if (serviceType === 'chatbot' && 'monthly_price' in plan) {
              response = await api.post(
                  '/api/v1/chatbot-subscriptions/subscribe',
                  { plan_id: plan.id, months_subscribed: selectedMonths },
                  token
              );
          } else {
              throw new Error("Loại gói không hợp lệ.");
          }

          if (response.status === 201 || response.status === 200) {
            setSelectedPlan(plan);
            setIsQrModalOpen(true);
          }
        } catch (err: any) {
          Swal.fire({
            title: 'Đăng ký thất bại',
            text: err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
            icon: 'error',
          });
        } finally {
          setIsSubscribing(null);
        }
    }
  };

  const videoFeatureRows = [
    { name: "🔥 Giá bán", getValue: (p: VideoPlan) => formatPrice(p.price), getNote: (p: VideoPlan) => p.description?.split(', ')[1] || null },
    { name: "📅 Số video/ngày", getValue: (p: VideoPlan) => p.max_videos_per_day },
    { name: "📋 Lên lịch trước tối đa", getValue: (p: VideoPlan) => `${p.max_scheduled_days} ngày` },
    { name: "💾 Số video có thể lưu cùng lúc", getValue: (p: VideoPlan) => p.max_stored_videos },
    { name: "💽 Dung lượng lưu trữ khuyến nghị", getValue: (p: VideoPlan) => `${p.storage_limit_gb}GB` },
    { name: "🗑️ Tự động xóa video sau đăng", getValue: () => "3 ngày" },
    { name: "👥 Tổng số tài khoản MXH", getValue: (p: VideoPlan) => p.max_social_accounts, note: "(Fanpage, Reels, Instagram, YouTube)" },
    { name: "🤖 Hỗ trợ AI viết nội dung", getValue: (p: VideoPlan) => p.ai_content_generation },
    { name: "☁️ Lưu trữ trên", getValue: () => "Đám mây" },
  ];
  
  const chatbotFeatureRows = [
      { name: "💵 Giá / tháng", getValue: (p: ChatbotPlan) => formatPrice(p.monthly_price) },
      { name: "🤖 Dịch vụ tích hợp", getValue: (p: ChatbotPlan) => p.services.map(s => s.name).join(', ') },
      { name: "🔌 Tích hợp API", getValue: () => true },
      { name: "💬 Script nhúng Website", getValue: () => true },
      { name: "📊 Phân tích cuộc trò chuyện", getValue: () => "Sắp ra mắt" },
  ];

  const renderFeatureValue = (
    value: any,
    feature: (typeof videoFeatureRows)[0] | (typeof chatbotFeatureRows)[0],
    plan: Plan
  ) => {
    if (typeof value === 'boolean') {
      return (
        <div className="flex justify-center">
          {value ? <Check className="text-green-500" size={20} /> : <X className="text-red-500" size={20} />}
        </div>
      );
    }
  
    // FIX: Restore special rendering for video plan price with note
    if (feature.name === "🔥 Giá bán" && 'getNote' in feature && typeof feature.getNote === 'function') {
      const note = feature.getNote(plan as VideoPlan);
      return (
        <div className="text-center">
          <div className="font-bold text-lg">{value}</div>
          {note && (
            <div className="text-xs text-purple-600 font-medium">{note}</div>
          )}
        </div>
      );
    }
  
    return <div className="text-center font-medium">{value}</div>;
  };

  const plansToDisplay = serviceType === 'video' ? videoPlans : chatbotPlans;
  const featureRows = serviceType === 'video' ? videoFeatureRows : chatbotFeatureRows;
  const currentSub = serviceType === 'video' ? currentSubs?.video_subscription : currentSubs?.chatbot_subscription;
  // FIX: Normalize the current plan object to avoid property access errors
  const currentPlanDetails = currentSub ? ('subscription_plan' in currentSub ? currentSub.subscription_plan : currentSub.plan) : null;

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Đang tải bảng giá...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">🌟 BẢNG GIÁ DỊCH VỤ</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Chọn gói phù hợp với nhu cầu của bạn.
          </p>

          {/* Service Type Toggle */}
          <div className="inline-flex bg-gray-200 rounded-full p-1 mb-8">
            <button 
                onClick={() => setServiceType('video')}
                className={`px-6 py-2 rounded-full text-lg font-semibold transition-colors duration-300 ${serviceType === 'video' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
            >
                <Video className="inline mr-2" size={20} /> Gói Video
            </button>
            <button 
                onClick={() => setServiceType('chatbot')}
                className={`px-6 py-2 rounded-full text-lg font-semibold transition-colors duration-300 ${serviceType === 'chatbot' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
            >
                <Bot className="inline mr-2" size={20} /> Gói Chatbot
            </button>
          </div>

          {/* --- UPDATED: Logic hiển thị gói hiện tại --- */}
          {isAuthenticated && currentSub && currentPlanDetails && (
            <>
              {currentSub.is_active ? (
                // Gói đã được kích hoạt
                <div className="inline-block bg-green-100 text-green-800 rounded-full px-4 py-2">
                  Gói hiện tại của bạn: <span className="font-bold">{currentPlanDetails.name}</span>
                  {currentSub.end_date && (
                    <> (Hết hạn: {new Date(currentSub.end_date).toLocaleDateString('vi-VN')})</>
                  )}
                </div>
              ) : (
                // Gói đang chờ phê duyệt
                <div className="inline-block bg-yellow-100 text-yellow-800 rounded-full px-4 py-2">
                  Gói đã đăng ký: <span className="font-bold">{currentPlanDetails.name}</span> (Trạng thái: Đang chờ phê duyệt)
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plansToDisplay.map((plan) => {
            const uiDetails = serviceType === 'video' ? getVideoPlanUIDetails(plan.name) : getChatbotPlanUIDetails(plan.name);
            const price = 'price' in plan ? plan.price : plan.monthly_price;
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl border-2 ${uiDetails.color} overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                  uiDetails.popular ? 'ring-4 ring-purple-200' : ''
                }`}
              >
                {uiDetails.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-bold">
                    Phổ biến nhất
                  </div>
                )}
                
                <div className={`${uiDetails.bgColor} p-8 ${uiDetails.popular ? 'pt-12' : ''}`}>
                  <div className="text-center">
                    <div className="h-8 mb-4 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2">
                          {uiDetails.icon}
                        </div>
                        <h3 className={`text-xl font-bold ${uiDetails.textColor}`}>{plan.name?.toUpperCase()}</h3>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className={`text-4xl font-bold ${uiDetails.textColor}`}>{formatPrice(price)}</span>
                      <span className="text-gray-600 text-lg">{formatDuration(plan)}</span>
                    </div>
                    
                    {serviceType === 'chatbot' && (
                        <div className="my-4">
                            <label className="text-sm font-medium text-gray-700">Số tháng:</label>
                            <select 
                                value={selectedMonths} 
                                onChange={(e) => setSelectedMonths(Number(e.target.value))}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                {[1, 3, 6, 12].map(m => <option key={m} value={m}>{m} tháng</option>)}
                            </select>
                        </div>
                    )}
                    
                    <p className="text-gray-600 mb-6 h-10">
                      {plan.description?.split(', ')[0] || ''}
                    </p>
                    
                    <button 
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isSubscribing === plan.id || (!!currentPlanDetails && currentPlanDetails.id === plan.id)}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${uiDetails.buttonColor} disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {isSubscribing === plan.id ? 'Đang xử lý...' : (currentPlanDetails && currentPlanDetails.id === plan.id ? 'Gói hiện tại' : 'Chọn gói này')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Detailed Comparison Table */}
        {plansToDisplay && plansToDisplay.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <div className={`grid grid-cols-${plansToDisplay.length + 1} gap-0`}>
                <div className="p-6 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <Star className="text-gray-600" size={20} />
                    <h3 className="text-lg font-bold text-gray-900">TÍNH NĂNG</h3>
                  </div>
                </div>
                {plansToDisplay.map((plan) => {
                  const uiDetails = serviceType === 'video' ? getVideoPlanUIDetails(plan.name) : getChatbotPlanUIDetails(plan.name);
                  return (
                    <div key={plan.id} className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {uiDetails.icon}
                        <h3 className={`text-lg font-bold ${uiDetails.textColor}`}>{plan.name.toUpperCase()}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Features Rows */}
            {featureRows.map((feature, featureIndex) => (
              <div key={featureIndex} className={`grid grid-cols-${plansToDisplay.length + 1} gap-0 ${featureIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100 hover:bg-blue-50 transition-colors`}>
                <div className="p-4 border-r border-gray-200 flex items-center">
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {feature.name}
                    </div>
                    {feature.note && (
                      <div className="text-xs text-gray-500 italic mt-1">{feature.note}</div>
                    )}
                  </div>
                </div>
                {plansToDisplay.map((plan) => (
                  <div key={plan.id} className="p-4 flex items-center justify-center min-h-[4rem]">
                    {renderFeatureValue(feature.getValue(plan), feature, plan)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Payment Modal */}
      {isQrModalOpen && selectedPlan && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100]"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div 
            className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full m-4 transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Thanh toán cho gói "{selectedPlan.name}"</h2>
            <p className="text-gray-600 mb-4">Vui lòng quét mã QR để thanh toán</p>
            
            <img 
              src="/assets/qr-bank.jpg" 
              alt="Mã QR thanh toán ngân hàng" 
              className="mx-auto mb-4 w-64 h-64 object-contain rounded-lg border-4 border-gray-200"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/256x256/e2e8f0/4a5568?text=QR+Lỗi'; e.currentTarget.alt = 'Lỗi tải mã QR'; }}
            />
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-lg text-gray-700 mb-2">
                    Số tiền cần chuyển: <span className="font-bold text-blue-600 text-xl">{formatPrice('price' in selectedPlan ? selectedPlan.price : selectedPlan.monthly_price * selectedMonths)}</span>
                </p>
                <p className="text-gray-600">
                    Nội dung chuyển khoản: <br/>
                    <strong className="text-red-600 text-lg tracking-wider bg-red-100 px-2 py-1 rounded">[SỐ ĐIỆN THOẠI CỦA BẠN]</strong>
                </p>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
                Sau khi chuyển khoản, hệ thống sẽ tự động kích hoạt gói trong vòng 1-3 phút.
            </p>

            <button 
              onClick={() => setIsQrModalOpen(false)}
              className="mt-6 bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold w-full"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
