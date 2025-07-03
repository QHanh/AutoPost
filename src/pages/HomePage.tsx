import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Share2, 
  Users, 
  Calendar,  
  ArrowRight, 
  Play, BarChart3,
  Shield,
  Clock,
  Sparkles,
  TrendingUp,
  Video
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: <Users className="text-blue-600" size={24} />,
      title: "Quản Lý Đa Nền Tảng",
      description: "Kết nối không giới hạn tài khoản từ Facebook, Instagram, YouTube và nhiều nền tảng khác."
    },
    {
      icon: <Calendar className="text-purple-600" size={24} />,
      title: "Lên Lịch & Tự Động Đăng Bài",
      description: "Lên lịch đăng bài thông minh với tính năng tự động đăng bài theo thời gian tối ưu nhất cho từng nền tảng."
    },
    {
      icon: <Video className="text-yellow-600" size={24} />,
      title: "Tạo Video Thu Hút",
      description: "Tạo video thu hút với các tính năng tự động."
    },
    {
      icon: <Sparkles className="text-pink-600" size={24} />,
      title: "Tao Nội Dung AI Hấp Dẫn",
      description: "Sử dụng AI để tạo nội dung chất lượng cao, phù hợp với từng nền tảng và đối tượng khán giả."
    },
    {
      icon: <BarChart3 className="text-green-600" size={24} />,
      title: "Phân Tích & Báo Cáo",
      description: "Theo dõi hiệu suất của từng nền tảng với các biểu đồ chi tiết."
    },
    {
      icon: <Shield className="text-red-600" size={24} />,
      title: "Bảo Mật & Riêng Tư",
      description: "Dữ liệu khách hàng được mã hóa và lưu trữ trên máy chủ cục bộ."
    }
  ];

  const platforms = [
    { name: "Facebook", icon: "📘", color: "bg-blue-100" },
    { name: "Instagram", icon: "📷", color: "bg-pink-100" },
    { name: "YouTube", icon: "📺", color: "bg-red-100" }
  ];

  const stats = [
    { number: "50K+", label: "Đăng Bài Đã Tạo", icon: <Share2 size={20} /> },
    { number: "1M+", label: "Tổng Nhận Được", icon: <TrendingUp size={20} /> },
    { number: "99.9%", label: "Đang Hoạt Động", icon: <Clock size={20} /> },
    { number: "24/7", label: "Hỗ Trợ", icon: <Shield size={20} /> } 
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full text-sm font-medium text-blue-700 mb-6">
                <Sparkles size={16} />
                Powered by Latest AI Technology
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Quản Lý Mọi
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Tài Khoản Mạng Xã Hội</span> Của Bạn.
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Kết nối không giới hạn tài khoản, tạo nội dung hấp dẫn với AI, lên lịch đăng bài trên tất cả các nền tảng.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/posts"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2"
              >
                Bắt Đầu Miễn Phí
                <ArrowRight size={20} />
              </Link>
              
              <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium text-lg">
                <div className="bg-white rounded-full p-3 shadow-lg">
                  <Play size={20} className="text-blue-600" />
                </div>
                Xem Demo
              </button>
            </div>

            {/* Platform Icons */}
            <div className="flex justify-center items-center gap-6 flex-wrap">
              <span className="text-gray-500 font-medium">Hỗ trợ đa nền tảng:</span>
              {platforms.map((platform, index) => (
                <div
                  key={index}
                  className={`${platform.color} p-3 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="font-medium text-gray-700 hidden sm:block">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Mọi Tính Năng Bạn Cần Để
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Thành Công</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Từ quản lý đa nền tảng đến tạo nội dung AI, cung cấp mọi công cụ bạn cần để tối ưu hóa chiến lược truyền thông xã hội của mình.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Bắt Đầu trong
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> 3 Bước Đơn Giản</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Đăng bài viết đầu tiên của bạn chỉ trong vài phút. Không yêu cầu kiến thức kỹ thuật.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Kết Nối Các Tài Khoản</h3>
              <p className="text-gray-600 leading-relaxed">
                Kết nối không giới hạn tài khoản từ Facebook, Instagram, YouTube và nhiều nền tảng khác chỉ trong vài cú nhấp chuột.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tạo Nội Dung</h3>
              <p className="text-gray-600 leading-relaxed">
                Sử dụng AI để tạo nội dung chất lượng cao, phù hợp với từng nền tảng và đối tượng khán giả. Chỉnh sửa và tùy chỉnh theo ý muốn.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-pink-500 to-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Đăng Bài & Lên Lịch</h3>
              <p className="text-gray-600 leading-relaxed">
                Lên lịch đăng bài thông minh với tính năng tự động đăng bài theo thời gian tối ưu nhất cho từng nền tảng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Những Người Dùng Yêu Thích
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of creators, businesses, and influencers who trust Social Hub for their social media management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Content Creator",
                avatar: "👩‍💼",
                rating: 5,
                text: "Social Hub has revolutionized my content workflow. I can now manage 15+ accounts effortlessly and my engagement has increased by 300%!"
              },
              {
                name: "Mike Chen",
                role: "Digital Marketer",
                avatar: "👨‍💻",
                rating: 5,
                text: "The AI content generation is incredible. It saves me hours every week and the quality is consistently high across all platforms."
              },
              {
                name: "Emma Davis",
                role: "Small Business Owner",
                avatar: "👩‍🚀",
                rating: 5,
                text: "Finally, a tool that actually works! The scheduling feature alone has saved me 10+ hours per week. Highly recommended!"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-2xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 leading-relaxed">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Sẵn Sàng Để Nâng Cấp
            <br />Chiến Lược Sử Dụng Mạng Xã Hội?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Tham gia cùng hàng nghìn người dùng khác và trải nghiệm sức mạnh của Social Hub. Tạo nội dung AI, quản lý đa nền tảng, và tối ưu hóa chiến lược truyền thông xã hội của bạn ngay hôm nay!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/posts"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2"
            >
              Bắt Đầu Miễn Phí
              <ArrowRight size={20} />
            </Link>
            
            <Link
              to="/pricing"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Bảng Giá
            </Link>
          </div>
          
          <p className="text-blue-100 text-sm mt-6">
            Không cần thẻ tín dụng. Hủy bất cứ lúc nào.
          </p>
        </div>
      </section>
    </div>
  );
};