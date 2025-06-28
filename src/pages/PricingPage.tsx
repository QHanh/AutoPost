import React, { useState } from 'react';
import { Check, X, Star, Zap, Crown, Rocket } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const features = [
    { 
      name: "🔥 Giá bán", 
      basic: "199K / tháng", 
      pro: "499K / 3 tháng", 
      premium: "1.699K / năm",
      proNote: "(giảm 16%)",
      premiumNote: "→ Tặng thêm 6 tháng"
    },
    { 
      name: "📅 Số video/ngày", 
      basic: "3", 
      pro: "6", 
      premium: "9" 
    },
    { 
      name: "📋 Lên lịch trước tối đa", 
      basic: "7 ngày", 
      pro: "14 ngày", 
      premium: "21 ngày" 
    },
    { 
      name: "💾 Số video có thể lưu cùng lúc", 
      basic: "30", 
      pro: "60", 
      premium: "90" 
    },
    { 
      name: "💽 Dung lượng lưu trữ khuyến nghị", 
      basic: "5GB", 
      pro: "10GB", 
      premium: "15GB" 
    },
    { 
      name: "🗑️ Tự động xóa video sau đăng", 
      basic: "7 ngày", 
      pro: "7 ngày", 
      premium: "7 ngày" 
    },
    { 
      name: "👥 Tổng số tài khoản MXH", 
      basic: "5", 
      pro: "8", 
      premium: "12",
      note: "(Fanpage, Reels, Instagram, YouTube)"
    },
    { 
      name: "👨‍👩‍👧‍👦 Thêm thành viên quản lý", 
      basic: "❌", 
      pro: "+1 thành viên", 
      premium: "+2 thành viên" 
    },
    { 
      name: "🤖 Hỗ trợ AI viết nội dung", 
      basic: "✅ Full: mô tả + hashtag + tiêu đề", 
      pro: "✅ Full", 
      premium: "✅ Full" 
    },
    { 
      name: "☁️ Lưu trữ trên", 
      basic: "Đám mây", 
      pro: "Đám mây", 
      premium: "Đám mây" 
    }
  ];

  const plans = [
    {
      name: "CƠ BẢN",
      icon: <Zap className="text-blue-600" size={24} />,
      price: "199K",
      period: "/ tháng",
      description: "Hoàn hảo cho cá nhân",
      color: "border-blue-200",
      bgColor: "bg-blue-50",
      textColor: "text-blue-900",
      buttonColor: "bg-blue-600 text-white hover:bg-blue-700",
      popular: false
    },
    {
      name: "TIẾT KIỆM",
      icon: <Crown className="text-purple-600" size={24} />,
      price: "499K",
      period: "/ 3 tháng",
      description: "Tốt nhất cho doanh nghiệp nhỏ",
      color: "border-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-900",
      buttonColor: "bg-purple-600 text-white hover:bg-purple-700",
      popular: true,
      discount: "giảm 16%"
    },
    {
      name: "CHUYÊN NGHIỆP",
      icon: <Rocket className="text-green-600" size={24} />,
      price: "1.699K",
      period: "/ năm",
      description: "Cho các agency và doanh nghiệp",
      color: "border-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-900",
      buttonColor: "bg-green-600 text-white hover:bg-green-700",
      popular: false,
      bonus: "Tặng thêm 6 tháng"
    }
  ];

  const getValue = (feature: any, planIndex: number) => {
    switch (planIndex) {
      case 0: return feature.basic;
      case 1: return feature.pro;
      case 2: return feature.premium;
      default: return feature.name;
    }
  };

  const renderValue = (value: string, feature: any, planIndex: number) => {
    if (value === "❌") {
      return (
        <div className="flex justify-center">
          <X className="text-red-500" size={20} />
        </div>
      );
    }
    if (value.includes("✅")) {
      return (
        <div className="text-center">
          <Check className="text-green-500 mx-auto mb-1" size={20} />
          <span className="text-xs text-gray-600">{value.replace("✅ ", "")}</span>
        </div>
      );
    }
    
    // Special handling for price row
    if (feature.name === "🔥 Giá bán") {
      return (
        <div className="text-center">
          <div className="font-bold text-lg">{value}</div>
          {planIndex === 1 && feature.proNote && (
            <div className="text-xs text-purple-600 font-medium">{feature.proNote}</div>
          )}
          {planIndex === 2 && feature.premiumNote && (
            <div className="text-xs text-green-600 font-medium">{feature.premiumNote}</div>
          )}
        </div>
      );
    }
    
    return <div className="text-center font-medium">{value}</div>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">🌟 BẢNG TỔNG QUAN DỊCH VỤ ĐĂNG BÀI TỰ ĐỘNG + LƯU TRỮ</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Chọn gói phù hợp với nhu cầu của bạn. Tất cả gói đều bao gồm lưu trữ đám mây và hỗ trợ AI viết nội dung.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Thanh toán hàng tháng
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Thanh toán hàng năm
            </span>
            {isAnnual && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                Tiết kiệm 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-xl border-2 ${plan.color} overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                plan.popular ? 'ring-4 ring-purple-200' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-bold">
                  Phổ biến nhất
                </div>
              )}
              
              <div className={`${plan.bgColor} p-8 ${plan.popular ? 'pt-12' : ''}`}>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {plan.icon}
                    <h3 className={`text-2xl font-bold ${plan.textColor}`}>{plan.name}</h3>
                  </div>
                  
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${plan.textColor}`}>{plan.price}</span>
                    <span className="text-gray-600 text-lg">{plan.period}</span>
                  </div>
                  
                  {plan.discount && (
                    <div className="text-purple-600 font-bold mb-2 bg-purple-100 rounded-full px-3 py-1 inline-block">
                      {plan.discount}
                    </div>
                  )}
                  
                  {plan.bonus && (
                    <div className="text-green-600 font-bold mb-2 bg-green-100 rounded-full px-3 py-1 inline-block">
                      {plan.bonus}
                    </div>
                  )}
                  
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <button className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${plan.buttonColor}`}>
                    Chọn gói này
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-0">
              <div className="p-6 border-r border-gray-200">
                <div className="flex items-center gap-2">
                  <Star className="text-gray-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">TÍNH NĂNG</h3>
                </div>
              </div>
              {plans.map((plan, index) => (
                <div key={index} className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {plan.icon}
                    <h3 className={`text-lg font-bold ${plan.textColor}`}>{plan.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Rows */}
          {features.map((feature, featureIndex) => (
            <div key={featureIndex} className={`grid grid-cols-4 gap-0 ${featureIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100 hover:bg-blue-50 transition-colors`}>
              <div className="p-4 border-r border-gray-200">
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  {feature.name}
                </div>
                {feature.note && (
                  <div className="text-xs text-gray-500 italic mt-1">{feature.note}</div>
                )}
              </div>
              {plans.map((plan, planIndex) => (
                <div key={planIndex} className="p-4 flex items-center justify-center min-h-[4rem]">
                  {renderValue(getValue(feature, planIndex), feature, planIndex)}
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