# 📱 Social Media Dashboard - Unified Posting Platform

<div align="center">

![Social Media Dashboard](https://img.shields.io/badge/Social%20Media-Dashboard-blue?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**Quản lý tất cả các nền tảng mạng xã hội của bạn trong một ứng dụng duy nhất**

[🚀 Demo Live](#) • [📖 Tài liệu](#tài-liệu) • [🐛 Báo lỗi](#báo-lỗi) • [💡 Đề xuất tính năng](#đề-xuất-tính-năng)

</div>

---

## 🌟 Tổng quan

**Social Media Dashboard** là một ứng dụng web hiện đại cho phép bạn quản lý và đăng bài lên nhiều nền tảng mạng xã hội cùng lúc. Được xây dựng với React, TypeScript và Tailwind CSS, ứng dụng cung cấp giao diện người dùng trực quan và các tính năng mạnh mẽ.

### ✨ Tính năng chính

- 🔗 **Kết nối đa nền tảng**: Facebook, Instagram, YouTube, Twitter, LinkedIn, TikTok
- 📸 **Upload media**: Hỗ trợ hình ảnh và video với drag & drop
- ⚡ **API mới nhất**: Facebook v23.0, Instagram v23.0 với tính năng nâng cao
- 📅 **Lên lịch đăng bài**: Đặt thời gian đăng bài tự động
- 🎯 **Validation thông minh**: Kiểm tra tương thích media cho từng nền tảng
- 📊 **Lịch sử bài đăng**: Theo dõi tất cả bài đăng đã đăng và đã lên lịch
- 🔒 **Bảo mật**: Token validation và xử lý lỗi nâng cao
- 📱 **Responsive**: Tối ưu cho mọi thiết bị

---

## 🏗️ Kiến trúc ứng dụng

### 📁 Cấu trúc thư mục

```
src/
├── components/           # React Components
│   ├── Header.tsx       # Header với thống kê
│   ├── PlatformCard.tsx # Card kết nối nền tảng
│   ├── PostComposer.tsx # Form tạo bài đăng
│   ├── PostHistory.tsx  # Lịch sử bài đăng
│   ├── MediaUploader.tsx # Upload media files
│   └── PlatformMediaValidator.tsx # Validation media
├── hooks/               # Custom React Hooks
│   ├── usePlatforms.ts  # Quản lý kết nối nền tảng
│   └── usePosts.ts      # Quản lý bài đăng
├── services/            # API Services
│   └── apiService.ts    # Tích hợp API các nền tảng
├── types/               # TypeScript Types
│   └── platform.ts     # Định nghĩa types
├── utils/               # Utility Functions
│   └── mediaUtils.ts    # Xử lý media files
└── App.tsx             # Component chính
```

### 🔧 Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **React** | ^18.3.1 | UI Framework |
| **TypeScript** | ^5.5.3 | Type Safety |
| **Tailwind CSS** | ^3.4.1 | Styling |
| **Vite** | ^5.4.2 | Build Tool |
| **Lucide React** | ^0.344.0 | Icons |

---

## 🚀 Cài đặt và chạy

### 📋 Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 hoặc **yarn**: >= 1.22.0

### ⚡ Cài đặt nhanh

```bash
cd social-media-dashboard

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Mở trình duyệt tại http://localhost:5173
```

### 🔨 Scripts có sẵn

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview production build
npm run lint     # Kiểm tra code với ESLint
```

---

## 📖 Hướng dẫn sử dụng

### 1️⃣ Kết nối nền tảng mạng xã hội

<details>
<summary><strong>🔗 Cách kết nối Facebook (API v23.0)</strong></summary>

1. **Truy cập Facebook Developer Console**
   - Đi tới [Facebook Developers](https://developers.facebook.com/)
   - Tạo ứng dụng mới hoặc sử dụng ứng dụng có sẵn

2. **Lấy Page Access Token**
   ```
   ⚠️ LƯU Ý: Facebook chỉ cho phép đăng lên Page, không phải profile cá nhân
   ```
   - Vào Graph API Explorer
   - Chọn Page của bạn
   - Yêu cầu quyền: `publish_pages`, `manage_pages`
   - Copy Page Access Token

3. **Kết nối trong ứng dụng**
   - Click nút "Connect" trên Facebook card
   - Paste Page Access Token
   - Click "Connect" để xác thực

</details>

<details>
<summary><strong>📷 Cách kết nối Instagram (API v23.0)</strong></summary>

1. **Chuẩn bị**
   - Cần có Instagram Business Account
   - Kết nối với Facebook Page

2. **Lấy Instagram Access Token**
   - Sử dụng Facebook Developer Console
   - Tạo Instagram Basic Display App
   - Lấy User Access Token với quyền `instagram_basic`

3. **Kết nối**
   - Click "Connect" trên Instagram card
   - Nhập Instagram Access Token
   - Xác thực kết nối

</details>

<details>
<summary><strong>📺 Cách kết nối YouTube</strong></summary>

1. **Google Cloud Console**
   - Tạo project mới tại [Google Cloud Console](https://console.cloud.google.com/)
   - Enable YouTube Data API v3
   - Tạo OAuth 2.0 credentials

2. **Lấy Access Token**
   - Sử dụng OAuth 2.0 flow
   - Yêu cầu scope: `https://www.googleapis.com/auth/youtube.upload`

3. **Kết nối**
   - Nhập OAuth 2.0 Access Token
   - Xác thực với YouTube API

</details>

### 2️⃣ Tạo và đăng bài

#### 📝 Tạo bài đăng mới

1. **Nhập nội dung**
   - Viết nội dung bài đăng (tối đa 2200 ký tự)
   - Nội dung sẽ được tự động điều chỉnh cho từng nền tảng

2. **Upload media (tùy chọn)**
   - Kéo thả hoặc click để chọn file
   - Hỗ trợ: JPG, PNG, GIF, MP4, MOV, AVI
   - Tối đa 10 files

3. **Chọn nền tảng**
   - Tick chọn các nền tảng muốn đăng
   - Hệ thống sẽ kiểm tra tương thích media

4. **Lên lịch (tùy chọn)**
   - Chọn thời gian đăng bài
   - Hoặc để trống để đăng ngay

5. **Đăng bài**
   - Click "Post Now" hoặc "Schedule Post"
   - Theo dõi trạng thái trong Post History

#### 🎯 Validation thông minh

Hệ thống tự động kiểm tra:
- ✅ Định dạng file được hỗ trợ
- ✅ Kích thước file phù hợp
- ✅ Số lượng media cho phép
- ✅ Thời lượng video
- ⚠️ Cảnh báo nếu có vấn đề

### 3️⃣ Quản lý bài đăng

#### 📊 Post History

- **Xem tất cả bài đăng**: Đã đăng, đã lên lịch, thất bại
- **Trạng thái realtime**: Theo dõi quá trình đăng bài
- **Links bài đăng**: Truy cập trực tiếp bài đăng trên từng nền tảng
- **Xóa bài đăng**: Quản lý danh sách bài đăng

#### 🔄 Trạng thái bài đăng

| Trạng thái | Mô tả | Icon |
|------------|-------|------|
| **Draft** | Bài nháp chưa đăng | 📝 |
| **Scheduled** | Đã lên lịch | ⏰ |
| **Posting** | Đang đăng | 🔄 |
| **Posted** | Đã đăng thành công | ✅ |
| **Failed** | Đăng thất bại | ❌ |

---

## 🔧 Cấu hình nâng cao

### 🌐 API Endpoints

```typescript
// Facebook API v23.0
const FACEBOOK_API = 'https://graph.facebook.com/v23.0';

// Instagram API v23.0  
const INSTAGRAM_API = 'https://graph.instagram.com/v23.0';

// YouTube Data API v3
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

// Twitter API v2
const TWITTER_API = 'https://api.twitter.com/2';

// LinkedIn API v2
const LINKEDIN_API = 'https://api.linkedin.com/v2';
```

### 📊 Giới hạn nền tảng

| Nền tảng | Hình ảnh | Video | Kích thước | Thời lượng |
|----------|----------|-------|------------|------------|
| **Facebook** | 10 | 1 | 10MB/1GB | 240 phút |
| **Instagram** | 10 | 1 | 30MB/650MB | 60 phút |
| **YouTube** | 1 | 1 | 2MB/256GB | 12 giờ |
| **Twitter** | 4 | 1 | 5MB/512MB | 2.2 phút |
| **LinkedIn** | 9 | 1 | 20MB/5GB | 10 phút |

### 🔒 Bảo mật

- **Token Encryption**: Tokens được mã hóa trong localStorage
- **API Validation**: Xác thực token trước khi sử dụng
- **Error Handling**: Xử lý lỗi chi tiết và user-friendly
- **Rate Limiting**: Tuân thủ giới hạn API của từng nền tảng

---

## 🎨 Tùy chỉnh giao diện

### 🎭 Theme Colors

```css
/* Primary Colors */
--blue-600: #2563eb;
--purple-600: #9333ea;
--green-600: #16a34a;
--red-600: #dc2626;

/* Platform Colors */
--facebook: #1877F2;
--instagram: #E4405F;
--youtube: #FF0000;
--twitter: #1DA1F2;
--linkedin: #0A66C2;
--tiktok: #000000;
```

### 📱 Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Tablet */
md: 768px   /* Desktop */
lg: 1024px  /* Large Desktop */
xl: 1280px  /* Extra Large */
```

---

## 🔍 Troubleshooting

### ❓ Các vấn đề thường gặp

<details>
<summary><strong>🚫 "Permission denied" khi đăng Facebook</strong></summary>

**Nguyên nhân**: Sử dụng User Access Token thay vì Page Access Token

**Giải pháp**:
1. Lấy Page Access Token từ Graph API Explorer
2. Đảm bảo có quyền `publish_pages` và `manage_pages`
3. Chọn đúng Page trong Graph API Explorer

</details>

<details>
<summary><strong>📸 "Media format not supported"</strong></summary>

**Nguyên nhân**: File không đúng định dạng hoặc quá lớn

**Giải pháp**:
1. Kiểm tra định dạng file được hỗ trợ
2. Nén file nếu quá lớn
3. Xem bảng giới hạn nền tảng ở trên

</details>

<details>
<summary><strong>🔑 "Invalid access token"</strong></summary>

**Nguyên nhân**: Token hết hạn hoặc không hợp lệ

**Giải pháp**:
1. Tạo token mới từ Developer Console
2. Kiểm tra quyền (permissions) của token
3. Đảm bảo token chưa hết hạn

</details>

### 🐛 Debug Mode

```bash
# Bật debug mode
npm run dev -- --debug

# Xem logs chi tiết
console.log('API Response:', response);
```

---

## 🤝 Đóng góp

### 🎯 Cách đóng góp

1. **Fork** repository
2. **Tạo branch** mới: `git checkout -b feature/amazing-feature`
3. **Commit** thay đổi: `git commit -m 'Add amazing feature'`
4. **Push** lên branch: `git push origin feature/amazing-feature`
5. **Tạo Pull Request**

### 📝 Coding Standards

- ✅ Sử dụng TypeScript cho type safety
- ✅ Follow ESLint rules
- ✅ Viết comments cho functions phức tạp
- ✅ Tạo tests cho features mới
- ✅ Update documentation

### 🏷️ Commit Convention

```
feat: thêm tính năng mới
fix: sửa bug
docs: cập nhật documentation
style: thay đổi styling
refactor: refactor code
test: thêm tests
chore: cập nhật build tools
```

---

## 📄 License

Dự án này được phân phối dưới **MIT License**. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 👥 Tác giả

**Social Media Dashboard Team**

- 🌐 Website: [your-website.com](https://your-website.com)
- 📧 Email: contact@your-website.com
- 🐦 Twitter: [@your-twitter](https://twitter.com/your-twitter)

---

## 🙏 Cảm ơn

Cảm ơn các dự án open source đã hỗ trợ:

- [React](https://reactjs.org/) - UI Framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework  
- [Lucide React](https://lucide.dev/) - Icon Library
- [Vite](https://vitejs.dev/) - Build Tool

---

## 📈 Roadmap

### 🎯 Version 2.0

- [ ] 🤖 AI Content Generation
- [ ] 📊 Analytics Dashboard
- [ ] 🔄 Auto-reposting
- [ ] 👥 Team collaboration
- [ ] 📱 Mobile app
- [ ] 🌍 Multi-language support

### 🎯 Version 1.1

- [x] ✅ Facebook API v23.0
- [x] ✅ Instagram API v23.0
- [x] ✅ Enhanced error handling
- [x] ✅ Token validation
- [ ] 🔔 Push notifications
- [ ] 📅 Calendar view

---

<div align="center">

**⭐ Nếu dự án này hữu ích, hãy cho chúng tôi một star! ⭐**

Made with ❤️ by Social Media Dashboard Team

</div>