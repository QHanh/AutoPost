import React from 'react';
import { 
  Target, 
  Users, 
  BarChart3, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Globe,
  TrendingUp,
  Calendar,
  Share2,
  Sparkles
} from 'lucide-react';

export const SolutionPage: React.FC = () => {
  const solutions = [
    {
      icon: <Users className="text-blue-600" size={32} />,
      title: "Quản lý đa tài khoản",
      description: "Kết nối và quản lý không giới hạn tài khoản trên tất cả các nền tảng mạng xã hội phổ biến.",
      features: [
        "Kết nối không giới hạn tài khoản",
        "Đặt tên tùy chỉnh cho từng tài khoản",
        "Quản lý tập trung từ một dashboard",
        "Hỗ trợ tất cả nền tảng chính"
      ],
      color: "bg-blue-50 border-blue-200"
    },
    {
      icon: <Calendar className="text-purple-600" size={32} />,
      title: "Lên lịch thông minh",
      description: "Lên lịch đăng bài tự động với thời gian tối ưu để tăng tương tác và tiếp cận.",
      features: [
        "Lên lịch đăng bài tự động",
        "Đề xuất thời gian tối ưu",
        "Đăng đồng thời nhiều nền tảng",
        "Theo dõi trạng thái real-time"
      ],
      color: "bg-purple-50 border-purple-200"
    },
    {
      icon: <Sparkles className="text-pink-600" size={32} />,
      title: "AI tạo nội dung",
      description: "Sử dụng AI tiên tiến để tạo nội dung hấp dẫn, tối ưu cho từng nền tảng mạng xã hội.",
      features: [
        "Tạo nội dung bằng AI",
        "Tối ưu cho từng nền tảng",
        "Hashtag thông minh",
        "Đa dạng phong cách viết"
      ],
      color: "bg-pink-50 border-pink-200"
    },
    {
      icon: <BarChart3 className="text-green-600" size={32} />,
      title: "Phân tích & Báo cáo",
      description: "Theo dõi hiệu suất bài đăng với báo cáo chi tiết và insights để tối ưu chiến lược.",
      features: [
        "Báo cáo hiệu suất chi tiết",
        "Phân tích tương tác",
        "So sánh giữa các nền tảng",
        "Đề xuất cải thiện"
      ],
      color: "bg-green-50 border-green-200"
    }
  ];

  const industries = [
    {
      name: "E-commerce",
      icon: "🛒",
      description: "Quản lý nhiều shop, sản phẩm trên các nền tảng bán hàng và mạng xã hội"
    },
    {
      name: "Agency Marketing",
      icon: "🎯",
      description: "Quản lý tài khoản của nhiều khách hàng từ một dashboard duy nhất"
    },
    {
      name: "Content Creator",
      icon: "🎨",
      description: "Tối ưu hóa việc đăng content và tương tác với audience trên nhiều kênh"
    },
    {
      name: "Doanh nghiệp",
      icon: "🏢",
      description: "Xây dựng thương hiệu và tiếp cận khách hàng trên tất cả nền tảng"
    },
    {
      name: "Influencer",
      icon: "⭐",
      description: "Quản lý personal brand và tối ưu engagement rate"
    },
    {
      name: "Startup",
      icon: "🚀",
      description: "Xây dựng presence online với ngân sách và nhân lực hạn chế"
    }
  ];

  const benefits = [
    {
      icon: <Clock className="text-blue-600" size={24} />,
      title: "Tiết kiệm thời gian",
      description: "Giảm 80% thời gian quản lý social media"
    },
    {
      icon: <TrendingUp className="text-green-600" size={24} />,
      title: "Tăng hiệu quả",
      description: "Tăng 300% tương tác và reach"
    },
    {
      icon: <Shield className="text-purple-600" size={24} />,
      title: "Bảo mật cao",
      description: "Mã hóa dữ liệu và lưu trữ an toàn"
    },
    {
      icon: <Zap className="text-yellow-600" size={24} />,
      title: "Dễ sử dụng",
      description: "Giao diện thân thiện, không cần kỹ thuật"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Giải pháp
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Social Media</span>
              <br />toàn diện
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Từ quản lý đa tài khoản đến AI tạo nội dung, chúng tôi cung cấp mọi công cụ 
              bạn cần để thành công trên mạng xã hội.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2">
                Khám phá giải pháp
                <ArrowRight size={20} />
              </button>
              
              <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium text-lg">
                <div className="bg-white rounded-full p-3 shadow-lg">
                  <Target size={20} className="text-blue-600" />
                </div>
                Tư vấn miễn phí
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Solutions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Giải pháp
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> chuyên nghiệp</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bộ công cụ hoàn chỉnh để quản lý và phát triển sự hiện diện trên mạng xã hội của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => (
              <div
                key={index}
                className={`${solution.color} rounded-2xl p-8 border-2 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}
              >
                <div className="mb-6">
                  <div className="bg-white w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    {solution.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{solution.title}</h3>
                  <p className="text-gray-700 leading-relaxed mb-6">{solution.description}</p>
                </div>

                <div className="space-y-3">
                  {solution.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Phù hợp cho
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> mọi ngành nghề</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Từ cá nhân đến doanh nghiệp lớn, giải pháp của chúng tôi đáp ứng nhu cầu đa dạng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{industry.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{industry.name}</h3>
                  <p className="text-gray-600 leading-relaxed">{industry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Lợi ích
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> vượt trội</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những lợi ích thiết thực mà khách hàng nhận được khi sử dụng Social Hub.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="text-center bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Quy trình
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> triển khai</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Từ setup đến vận hành, chúng tôi hỗ trợ bạn từng bước một cách chuyên nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Tư vấn & Phân tích",
                description: "Phân tích nhu cầu và đề xuất giải pháp phù hợp"
              },
              {
                step: "02", 
                title: "Setup & Kết nối",
                description: "Thiết lập tài khoản và kết nối các nền tảng"
              },
              {
                step: "03",
                title: "Training & Hướng dẫn", 
                description: "Đào tạo sử dụng và tối ưu hóa workflow"
              },
              {
                step: "04",
                title: "Vận hành & Hỗ trợ",
                description: "Hỗ trợ 24/7 và tối ưu hóa liên tục"
              }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold">
                  {process.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{process.title}</h3>
                <p className="text-gray-600 leading-relaxed">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Sẵn sàng chuyển đổi
            <br />chiến lược Social Media?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Liên hệ với chúng tôi để được tư vấn miễn phí và trải nghiệm demo sản phẩm.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2">
              Tư vấn miễn phí
              <ArrowRight size={20} />
            </button>
            
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
              Xem Demo
            </button>
          </div>
          
          <p className="text-blue-100 text-sm mt-6">
            Tư vấn miễn phí • Demo trực tiếp • Hỗ trợ 24/7
          </p>
        </div>
      </section>
    </div>
  );
};