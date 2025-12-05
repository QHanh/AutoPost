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
    max_api_calls?: number | null;
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
    max_api_calls?: number | null;
    api_calls_used?: number;
    status?: string;
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
      console.log('=== STARTING FETCH DATA ===');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('token:', token ? 'exists' : 'null');
      
      try {
        setLoading(true);
        setError(null); // Reset error state
        
        // Luôn fetch plans trước (không cần token)
        const videoPlansPromise = api.get<VideoPlan[]>('/api/v1/subscriptions/plans', token);
        const chatbotPlansPromise = api.get<ChatbotPlan[]>('/api/v1/chatbot-subscriptions/plans', token);
        
        // Fetch plans trước
        const [videoPlansResponse, chatbotPlansResponse] = await Promise.all([videoPlansPromise, chatbotPlansPromise]);

        console.log('=== DEBUG PLANS RESPONSES ===');
        console.log('Video plans response:', videoPlansResponse);
        console.log('Chatbot plans response:', chatbotPlansResponse);

        // Process Video Plans
        if (videoPlansResponse && Array.isArray(videoPlansResponse.data)) {
          const sortedPlans = videoPlansResponse.data
            .filter((p: VideoPlan) => p && p.is_active)
            .sort((a: VideoPlan, b: VideoPlan) => (a.price || 0) - (b.price || 0));
          setVideoPlans(sortedPlans);
        } else {
          console.warn("Video plans data is invalid, setting empty array");
          setVideoPlans([]);
        }

        // Process Chatbot Plans
        if (chatbotPlansResponse && Array.isArray(chatbotPlansResponse.data)) {
            setChatbotPlans(chatbotPlansResponse.data.filter(p => p).sort((a,b) => a.monthly_price - b.monthly_price));
        } else {
          console.warn("Chatbot plans data is invalid, setting empty array");
          setChatbotPlans([]);
        }
        
        // Sau khi đã load plans thành công, mới fetch subscriptions (nếu user đã đăng nhập)
        if (isAuthenticated && token) {
          console.log('User is authenticated, fetching subscriptions...');

          const videoSubsPromise = api.get<MySubscriptions>('/api/v1/subscriptions/me', token);
          const chatbotSubsPromise = api.get<ChatbotSubscription>('/api/v1/chatbot-subscriptions/me', token);

          // Sử dụng Promise.allSettled để không bị fail-fast
          const results = await Promise.allSettled([videoSubsPromise, chatbotSubsPromise]);

          const videoResult = results[0];
          const chatbotResult = results[1];
          
          let finalVideoSub: VideoSubscription | null = null;
          let finalChatbotSub: ChatbotSubscription | null = null;

          if (videoResult.status === 'fulfilled') {
              console.log('Video subscription API call successful:', videoResult.value);
              finalVideoSub = videoResult.value.data?.video_subscription || null;
              // Lấy thông tin chatbot từ API này làm cơ sở
              finalChatbotSub = videoResult.value.data?.chatbot_subscription || null; 
          } else {
              console.warn('Failed to fetch video subscriptions:', videoResult.reason);
          }

          if (chatbotResult.status === 'fulfilled') {
              console.log('Chatbot subscription API call successful:', chatbotResult.value);
              // Nếu API chatbot trả về dữ liệu, nó sẽ ghi đè lên dữ liệu cũ
              if (chatbotResult.value.data) {
                   finalChatbotSub = chatbotResult.value.data;
              }
          } else {
              console.warn('Failed to fetch chatbot subscription:', chatbotResult.reason);
          }

          setCurrentSubs({
              video_subscription: finalVideoSub,
              chatbot_subscription: finalChatbotSub
          });

        } else {
          console.log('User not authenticated or no token, setting empty subscriptions');
          setCurrentSubs({
            video_subscription: null,
            chatbot_subscription: null
          });
        }
        
      } catch (err: any) {
        console.error("Critical error when loading data:", err);
        // Chỉ set error nếu không load được plans (critical)
        if (videoPlans.length === 0 && chatbotPlans.length === 0) {
        setError(err.message || "Không thể tải dữ liệu bảng giá.");
        } else {
          // Nếu đã load được plans nhưng không load được subscriptions, chỉ log warning
          console.warn("Failed to load some data, but plans are available:", err);
        }
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
            // Hiển thị mã QR cho cả video và chatbot
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
      { 
        name: "📞 Lượt API trong gói", 
        getValue: (p: ChatbotPlan) => {
          if (p.max_api_calls && p.max_api_calls > 0) {
            return `${p.max_api_calls.toLocaleString()} lượt (dùng GEMINI_API_KEY của hệ thống)`;
          }
          return "Dùng API key của bạn (không giới hạn lượt từ hệ thống)";
        } 
      },
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
  
  // Lấy subscription hiện tại dựa trên loại dịch vụ
  const currentSub = serviceType === 'video' ? currentSubs?.video_subscription : currentSubs?.chatbot_subscription;
  
  // Sửa lại logic để truy cập đúng cấu trúc dữ liệu
  const currentPlanDetails = currentSub ? 
    (serviceType === 'video' ? currentSub.subscription_plan : currentSub.plan) : null;
  
  // Kiểm tra xem user có subscription đang chờ phê duyệt không
  const hasPendingSubscription = serviceType === 'chatbot' && 
                               currentSubs?.chatbot_subscription && 
                               !currentSubs.chatbot_subscription.is_active;
  
  console.log('=== DEBUG SUBSCRIPTION STATUS ===');
  console.log('Service type:', serviceType);
  console.log('Has chatbot subscription:', !!currentSubs?.chatbot_subscription);
  console.log('Chatbot subscription is_active:', currentSubs?.chatbot_subscription?.is_active);
  console.log('Has pending subscription:', hasPendingSubscription);
  
  // Kiểm tra xem user có subscription active không
  const hasActiveSubscription = currentSub && currentSub.is_active;
  
  const chatbotUsage = currentSubs?.chatbot_subscription
    ? {
        max: currentSubs.chatbot_subscription.max_api_calls ?? null,
        used: currentSubs.chatbot_subscription.api_calls_used ?? 0,
      }
    : null;

  const chatbotUsagePercent = chatbotUsage && chatbotUsage.max && chatbotUsage.max > 0
    ? Math.min(100, (chatbotUsage.used / chatbotUsage.max) * 100)
    : null;
  
  // Kiểm tra xem plan hiện tại có phải là plan đang sử dụng không
  const isCurrentPlan = (plan: Plan) => {
    if (!currentPlanDetails) {
      console.log('No current plan details, returning false');
      return false;
    }
    const isMatch = plan.id === currentPlanDetails.id;
    console.log(`Plan ${plan.name} (${plan.id}) vs Current ${currentPlanDetails.name} (${currentPlanDetails.id}): ${isMatch}`);
    return isMatch;
  };
  
  // Kiểm tra xem có thể đăng ký plan này không
  const canSubscribeToPlan = (plan: Plan) => {
    if (isSubscribing === plan.id) {
      console.log(`Plan ${plan.name}: Disabled - đang xử lý`);
      return false;
    }
    if (isCurrentPlan(plan)) {
      console.log(`Plan ${plan.name}: Disabled - đã là gói hiện tại`);
      return false;
    }
    if (hasPendingSubscription) {
      console.log(`Plan ${plan.name}: Disabled - đang chờ phê duyệt`);
      return false;
    }
    console.log(`Plan ${plan.name}: Enabled - có thể đăng ký`);
    return true;
  };
  
  // Debug log để xem dữ liệu
  console.log('Current service type:', serviceType);
  console.log('Current subscriptions:', currentSubs);
  console.log('Current subscription for service type:', currentSub);
  console.log('Current plan details:', currentPlanDetails);
  console.log('Video subscription details:', currentSubs?.video_subscription);
  console.log('Chatbot subscription details:', currentSubs?.chatbot_subscription);
  console.log('=== DEBUG PLAN MATCHING ===');
  console.log('Current plan details ID:', currentPlanDetails?.id);
  console.log('Current plan details name:', currentPlanDetails?.name);
  console.log('Plans to display:', plansToDisplay.map(p => ({ id: p.id, name: p.name })));
  console.log('Is current plan check for first plan:', plansToDisplay.length > 0 ? isCurrentPlan(plansToDisplay[0]) : 'No plans');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-8"></div>
            <h2 className="text-2xl font-semibold text-gray-700">Đang tải bảng giá...</h2>
            <p className="text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  // Nếu có lỗi nghiêm trọng (không load được plans), hiển thị error page
  if (error && videoPlans.length === 0 && chatbotPlans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">Không thể tải bảng giá</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu không có plans nào, hiển thị thông báo
  if (videoPlans.length === 0 && chatbotPlans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <div className="text-yellow-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">Chưa có gói dịch vụ</h2>
            <p className="text-yellow-600 mb-6">Hiện tại chưa có gói dịch vụ nào được cấu hình. Vui lòng liên hệ admin để được hỗ trợ.</p>
          </div>
        </div>
      </div>
    );
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
                <Video className="inline mr-2" size={20} /> Gói đăng bài
            </button>
            <button 
                onClick={() => setServiceType('chatbot')}
                className={`px-6 py-2 rounded-full text-lg font-semibold transition-colors duration-300 ${serviceType === 'chatbot' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
            >
                <Bot className="inline mr-2" size={20} /> Gói Chatbot
            </button>
          </div>

          {/* Tổng quan subscriptions */}
          {isAuthenticated && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">📊 Tổng quan gói đăng ký của bạn</h3>
              {console.log('=== RENDERING SUBSCRIPTIONS OVERVIEW ===')}
              {console.log('isAuthenticated:', isAuthenticated)}
              {console.log('currentSubs in render:', currentSubs)}
              {console.log('currentSubs?.video_subscription:', currentSubs?.video_subscription)}
              {console.log('currentSubs?.chatbot_subscription:', currentSubs?.chatbot_subscription)}
              {console.log('Video subscription structure:', JSON.stringify(currentSubs?.video_subscription, null, 2))}
              {console.log('Chatbot subscription structure:', JSON.stringify(currentSubs?.chatbot_subscription, null, 2))}
              
              {/* Thông báo cảnh báo nếu có lỗi load subscriptions */}
              {error && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-yellow-800 text-sm">
                      Không thể tải thông tin gói đăng ký hiện tại. Bạn vẫn có thể xem và đăng ký gói mới.
                    </span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gói Video */}
                <div className="text-center">
                  <Video className="inline mr-2 text-blue-600" size={20} />
                  <span className="font-medium text-gray-700">Gói đăng bài:</span>
                  {currentSubs?.video_subscription ? (
                    <div className="mt-1">
                      {console.log('Rendering video subscription:', currentSubs.video_subscription)}
                      <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                        currentSubs.video_subscription.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {currentSubs.video_subscription.subscription_plan?.name || 'Không xác định'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {currentSubs.video_subscription.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm mt-1">
                      {console.log('No video subscription found')}
                      Chưa có gói
                    </div>
                  )}
                </div>
                
                {/* Gói Chatbot */}
                <div className="text-center">
                  <Bot className="inline mr-2 text-purple-600" size={20} />
                  <span className="font-medium text-gray-700">Gói Chatbot:</span>
                  {currentSubs?.chatbot_subscription ? (
                    <div className="mt-1">
                      {console.log('Rendering chatbot subscription:', currentSubs.chatbot_subscription)}
                      <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                        currentSubs.chatbot_subscription.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {currentSubs.chatbot_subscription.plan?.name || 'Không xác định'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {currentSubs.chatbot_subscription.is_active ? 'Đang hoạt động' : 'Chờ phê duyệt'}
                        {currentSubs.chatbot_subscription.months_subscribed && (
                          <> • {currentSubs.chatbot_subscription.months_subscribed} tháng</>
                        )}
                      </div>
                      {typeof currentSubs.chatbot_subscription.max_api_calls !== 'undefined' && currentSubs.chatbot_subscription.max_api_calls !== null && currentSubs.chatbot_subscription.max_api_calls > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Lượt đã dùng: {(currentSubs.chatbot_subscription.api_calls_used ?? 0).toLocaleString()} / {currentSubs.chatbot_subscription.max_api_calls.toLocaleString()}
                        </div>
                      )}
                      {(currentSubs.chatbot_subscription.max_api_calls === null || currentSubs.chatbot_subscription.max_api_calls === 0 || typeof currentSubs.chatbot_subscription.max_api_calls === 'undefined') && (
                        <div className="text-xs text-gray-500 mt-1">
                          Dùng API key riêng của bạn, không giới hạn lượt từ hệ thống.
                        </div>
                      )}
                </div>
              ) : (
                    <div className="text-gray-500 text-sm mt-1">
                      {console.log('No chatbot subscription found')}
                      Chưa có gói
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plansToDisplay.length > 0 ? (
            plansToDisplay.map((plan) => {
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
                    
                    {serviceType === 'chatbot' && 'monthly_price' in plan && (
                      <p className="text-xs text-gray-500 mb-1 min-h-[1.25rem]">
                        {'max_api_calls' in plan && (plan as any).max_api_calls && (plan as any).max_api_calls > 0
                          ? `Gói mua theo lượt: ${((plan as any).max_api_calls as number).toLocaleString()} lượt API dùng GEMINI_API_KEY hệ thống.`
                          : 'Dùng API key Gemini/OpenAI của riêng bạn, không giới hạn lượt từ hệ thống.'}
                      </p>
                    )}

                    <p className="text-gray-600 mb-6 h-10">
                      {plan.description?.split(', ')[0] || ''}
                    </p>
                    
                    <button 
                      onClick={() => handleSelectPlan(plan)}
                        disabled={!canSubscribeToPlan(plan)}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${uiDetails.buttonColor} disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        {isSubscribing === plan.id ? 'Đang xử lý...' : 
                         isCurrentPlan(plan) ? 'Gói hiện tại' :
                         hasPendingSubscription ? 'Đang chờ phê duyệt' :
                         'Chọn gói này'}
                    </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có gói dịch vụ</h3>
                <p className="text-gray-500">Hiện tại chưa có gói dịch vụ nào được cấu hình cho loại dịch vụ này.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Detailed Comparison Table */}
        {plansToDisplay && plansToDisplay.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                  <th scope="col" className="p-6 text-left align-middle border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <Star className="text-gray-600" size={20} />
                      <span className="text-lg font-bold text-gray-900">TÍNH NĂNG</span>
                    </div>
                  </th>
                  {plansToDisplay.map((plan) => {
                    const uiDetails = serviceType === 'video' ? getVideoPlanUIDetails(plan.name) : getChatbotPlanUIDetails(plan.name);
                    return (
                      <th key={plan.id} scope="col" className="p-6 text-center align-middle">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {uiDetails.icon}
                          <span className={`text-lg font-bold ${uiDetails.textColor}`}>{plan.name.toUpperCase()}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((feature, featureIndex) => (
                  <tr
                    key={featureIndex}
                    className={`${featureIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100 hover:bg-blue-50 transition-colors`}
                  >
                    <th scope="row" className="p-4 text-left align-top border-r border-gray-200">
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {feature.name}
                        </div>
                        {feature.note && (
                          <div className="text-xs text-gray-500 italic mt-1">{feature.note}</div>
                        )}
                      </div>
                    </th>
                    {plansToDisplay.map((plan) => (
                      <td key={plan.id} className="p-4 text-center align-middle min-h-[4rem]">
                        {renderFeatureValue(feature.getValue(plan), feature, plan)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Không có gói dịch vụ nào để so sánh.</p>
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
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Thanh toán cho gói "{selectedPlan.name}" 
              {serviceType === 'chatbot' && ` (${selectedMonths} tháng)`}
            </h2>
            <p className="text-gray-600 mb-4">
              {serviceType === 'chatbot' 
                ? 'Vui lòng quét mã QR để thanh toán. Gói sẽ được admin phê duyệt sau khi thanh toán.'
                : 'Vui lòng quét mã QR để thanh toán'
              }
            </p>
            
            <img 
              src="/assets/qr-bank.jpg" 
              alt="Mã QR thanh toán ngân hàng" 
              className="mx-auto mb-4 w-64 h-64 object-contain rounded-lg border-4 border-gray-200"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/256x256/e2e8f0/4a5568?text=QR+Lỗi'; e.currentTarget.alt = 'Lỗi tải mã QR'; }}
            />
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-lg text-gray-700 mb-2">
                    Số tiền cần chuyển: <span className="font-bold text-blue-600 text-xl">
                    {serviceType === 'chatbot' && 'monthly_price' in selectedPlan 
                      ? formatPrice(selectedPlan.monthly_price * selectedMonths)
                      : formatPrice('price' in selectedPlan ? selectedPlan.price : 0)
                    }</span>
                </p>
                <p className="text-gray-600">
                    Nội dung chuyển khoản: <br/>
                    <strong className="text-red-600 text-lg tracking-wider bg-red-100 px-2 py-1 rounded">
                      {serviceType === 'chatbot' ? 'CHATBOT_' : ''}[SỐ ĐIỆN THOẠI CỦA BẠN]
                    </strong>
                </p>
                {serviceType === 'chatbot' && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Lưu ý:</strong> Sau khi thanh toán, gói chatbot sẽ được admin phê duyệt trong vòng 24h.
                  </p>
                )}
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
                {serviceType === 'chatbot' 
                  ? 'Sau khi chuyển khoản, gói chatbot sẽ được admin phê duyệt trong vòng 24h.'
                  : 'Sau khi chuyển khoản, hệ thống sẽ tự động kích hoạt gói trong vòng 1-3 phút.'
                }
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