import React, { useState, useEffect } from 'react';
import { Check, X, Star, Zap, Crown, Rocket } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// --- TYPE DEFINITIONS ---
interface Plan {
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

interface UserSubscription {
  id: string;
  user_id: string;
  plan: Plan;
  subscription_plan: Plan;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

// A simple API client using fetch
const api = {
  get: async <T,>(url: string, token?: string | null): Promise<{ data: T }> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}${url}`, { headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'An unknown error occurred');
    }

    const data = await response.json();
    return { data };
  },
};

// --- UI HELPER FUNCTIONS ---

const getPlanUIDetails = (planName: string) => {
  switch (planName) {
    case "Tiết kiệm":
      return {
        icon: <Crown className="text-purple-600" size={24} />,
        color: "border-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-900",
        buttonColor: "bg-purple-600 text-white hover:bg-purple-700", popular: true,
      };
    case "Chuyên nghiệp":
      return {
        icon: <Rocket className="text-green-600" size={24} />,
        color: "border-green-500", bgColor: "bg-green-50", textColor: "text-green-900",
        buttonColor: "bg-green-600 text-white hover:bg-green-700", popular: false,
      };
    case "Cơ bản":
    default:
      return {
        icon: <Zap className="text-blue-600" size={24} />,
        color: "border-blue-200", bgColor: "bg-blue-50", textColor: "text-blue-900",
        buttonColor: "bg-blue-600 text-white hover:bg-blue-700", popular: false,
      };
  }
};

const formatPrice = (price: number) => {
  return `${(price / 1000).toLocaleString('de-DE')}K`;
};

const formatDuration = (plan: Plan) => {
  if (plan.name === 'Chuyên nghiệp') return '/ năm';
  if (plan.duration_days >= 90) return `/ ${plan.duration_days / 30} tháng`;
  if (plan.duration_days >= 30) return '/ tháng';
  return `/ ${plan.duration_days} ngày`;
};


export const PricingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        setLoading(true);
        const plansPromise = api.get<Plan[]>('/api/v1/subscriptions/plans', token);
        
        const promises: [Promise<any>, Promise<any> | null] = [plansPromise, null];
        if (isAuthenticated && token) {
          promises[1] = api.get<UserSubscription>('/api/v1/subscriptions/me', token);
        }

        const [plansResponse, currentSubResponse] = await Promise.all(promises);

        // Add robust check for plans data
        if (plansResponse && Array.isArray(plansResponse.data)) {
          setPlans(plansResponse.data.filter((p: Plan) => p.is_active));
        } else {
          setPlans([]); // Default to empty array if data is not an array
        }
        
        console.log("Subscription Response:", currentSubResponse); // DEBUG
        if (currentSubResponse && currentSubResponse.data && currentSubResponse.data.id) {
          console.log("Setting current subscription:", currentSubResponse.data); // DEBUG
          setCurrentSub(currentSubResponse.data);
        }
        
      } catch (err: any) {
        console.error("Failed to fetch pricing data:", err); // DEBUG
        setError(err.message || "Không thể tải dữ liệu bảng giá.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const featureRows = [
    { name: "🔥 Giá bán", getValue: (p: Plan) => formatPrice(p.price), getNote: (p: Plan) => p.description.split(', ')[1] || null },
    { name: "📅 Số video/ngày", getValue: (p: Plan) => p.max_videos_per_day },
    { name: "📋 Lên lịch trước tối đa", getValue: (p: Plan) => `${p.max_scheduled_days} ngày` },
    { name: "💾 Số video có thể lưu cùng lúc", getValue: (p: Plan) => p.max_stored_videos },
    { name: "💽 Dung lượng lưu trữ khuyến nghị", getValue: (p: Plan) => `${p.storage_limit_gb}GB` },
    { name: "🗑️ Tự động xóa video sau đăng", getValue: () => "7 ngày" },
    { name: "👥 Tổng số tài khoản MXH", getValue: (p: Plan) => p.max_social_accounts, note: "(Fanpage, Reels, Instagram, YouTube)" },
    { name: "🤖 Hỗ trợ AI viết nội dung", getValue: (p: Plan) => p.ai_content_generation },
    { name: "☁️ Lưu trữ trên", getValue: () => "Đám mây" },
  ];

  const renderFeatureValue = (
    value: string | number | boolean,
    feature: (typeof featureRows)[0],
    plan: Plan
  ) => {
    if (!plan) return <div className="text-center text-red-500">Lỗi dữ liệu</div>;
  
    if (typeof value === 'boolean') {
      return (
        <div className="flex justify-center">
          {value ? <Check className="text-green-500" size={20} /> : <X className="text-red-500" size={20} />}
        </div>
      );
    }
  
    if (feature.name === "🔥 Giá bán") {
      const note =
        feature.getNote && typeof feature.getNote === "function"
          ? feature.getNote(plan)
          : null;
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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Đang tải bảng giá...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Không có gói cước nào</h2>
        <p className="text-gray-500">Hiện tại không có gói cước nào để hiển thị. Vui lòng quay lại sau.</p>
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
            Chọn gói phù hợp với nhu cầu của bạn. Tất cả gói đều bao gồm lưu trữ đám mây và hỗ trợ AI viết nội dung.
          </p>
          {isAuthenticated && currentSub && currentSub.subscription_plan && (
            <div className="inline-block bg-green-100 text-green-800 rounded-full px-4 py-2">
              Gói hiện tại của bạn: <span className="font-bold">{currentSub.subscription_plan.name}</span>
              {currentSub.end_date && (
                <> (Hết hạn: {new Date(currentSub.end_date).toLocaleDateString('vi-VN')})</>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.filter((plan): plan is Plan => !!plan && typeof plan === 'object' && typeof plan.name === 'string').map((plan) => {
            const uiDetails = getPlanUIDetails(plan.name);
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
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {uiDetails.icon}
                      <h3 className={`text-2xl font-bold ${uiDetails.textColor}`}>{plan.name.toUpperCase()}</h3>
                    </div>
                    
                    <div className="mb-4">
                      <span className={`text-4xl font-bold ${uiDetails.textColor}`}>{formatPrice(plan.price)}</span>
                      <span className="text-gray-600 text-lg">{formatDuration(plan)}</span>
                    </div>
                    
                    <div className="h-8">
                      {(plan.description && plan.description.split(', ')[1]) ? (
                        <div className="text-purple-600 font-bold mb-2 bg-purple-100 rounded-full px-3 py-1 inline-block text-sm">
                          {plan.description.split(', ')[1]}
                        </div>
                      ) : null}
                    </div>
                    <p className="text-gray-600 mb-6 h-10">
                      {plan.description ? plan.description.split(', ')[0] : ''}
                    </p>
                    
                    <button className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${uiDetails.buttonColor}`}>
                      Chọn gói này
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <div className={`grid grid-cols-${plans.length + 1} gap-0`}>
              <div className="p-6 border-r border-gray-200">
                <div className="flex items-center gap-2">
                  <Star className="text-gray-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">TÍNH NĂNG</h3>
                </div>
              </div>
              {plans.filter((plan): plan is Plan => !!plan && typeof plan === 'object' && typeof plan.name === 'string').map((plan) => {
                const uiDetails = getPlanUIDetails(plan.name);
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
            <div key={featureIndex} className={`grid grid-cols-${plans.length + 1} gap-0 ${featureIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100 hover:bg-blue-50 transition-colors`}>
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
              {plans.filter((plan): plan is Plan => !!plan && typeof plan === 'object' && typeof plan.name === 'string').map((plan) => (
                <div key={plan.id} className="p-4 flex items-center justify-center min-h-[4rem]">
                  {renderFeatureValue(feature.getValue(plan), feature, plan)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Câu hỏi thường gặp</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <h3 className="font-bold text-gray-900 mb-3">Tôi có thể thay đổi gói bất cứ lúc nào không?</h3>
              <p className="text-gray-600">
                Có, bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào. Phí sẽ được tính theo tỷ lệ.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <h3 className="font-bold text-gray-900 mb-3">Có hỗ trợ khách hàng không?</h3>
              <p className="text-gray-600">
                Có, chúng tôi cung cấp hỗ trợ 24/7 qua email và chat trực tuyến cho tất cả các gói.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <h3 className="font-bold text-gray-900 mb-3">Dữ liệu của tôi có an toàn không?</h3>
              <p className="text-gray-600">
                Tất cả dữ liệu được mã hóa và lưu trữ an toàn trên đám mây với backup hàng ngày.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <h3 className="font-bold text-gray-900 mb-3">Có thể hủy bất cứ lúc nào không?</h3>
              <p className="text-gray-600">
                Có, bạn có thể hủy đăng ký bất cứ lúc nào mà không mất phí. Dịch vụ sẽ tiếp tục đến hết chu kỳ thanh toán.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Tham gia cùng hàng nghìn người dùng đã tin tưởng dịch vụ của chúng tôi
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            Bắt đầu dùng thử miễn phí
          </button>
        </div>
      </div>
    </div>
  );
};