# Tab Cài Đặt (Settings) - Hướng Dẫn Sử Dụng

## Tổng Quan

Tab Cài Đặt cho phép người dùng tùy chỉnh cấu hình chatbot AI và các tính năng hệ thống.

## Cách Truy Cập

1. **Đăng nhập** vào hệ thống
2. **Vào ChatbotPage** (trang quản lý chính)
3. **Click vào tab "Cài đặt"** trong menu bên trái (có icon Settings)

## Các Tính Năng

### 1. Cấu Hình Chatbot AI
- **Tên Chatbot AI**: Đặt tên cho chatbot (mặc định: "Mai")
- **Vai Trò Chatbot**: Định nghĩa vai trò của chatbot (mặc định: "trợ lý ảo")

### 2. System Prompt Tùy Chỉnh
- **Prompt Tùy Chỉnh**: Viết system prompt riêng cho chatbot
- **Lưu ý**: Để trống để sử dụng prompt mặc định của hệ thống

### 3. Tính Năng Hệ Thống
- **Tư Vấn Dịch Vụ**: Bật/tắt tính năng tư vấn về các dịch vụ
- **Tư Vấn Phụ Kiện**: Bật/tắt tính năng tư vấn về phụ kiện

## Cách Sử Dụng

### 1. Thay Đổi Cấu Hình
1. **Chỉnh sửa** các trường cần thiết
2. **Click "Lưu Cấu Hình"** để lưu thay đổi
3. **Chờ thông báo** thành công

### 2. Đặt Lại Mặc Định
1. **Click "Đặt Lại Mặc Định"**
2. **Xác nhận** trong hộp thoại
3. **Hệ thống** sẽ reset về giá trị ban đầu

## Cấu Hình Môi Trường

### Tạo file .env trong AutoPost/
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Environment
NODE_ENV=development
```

## Lưu Ý Quan Trọng

1. **Đăng nhập**: Phải đăng nhập để sử dụng tab cài đặt
2. **Lưu cấu hình**: Click nút "Lưu Cấu Hình" sau khi thay đổi
3. **user_id**: Hệ thống tự động lấy user_id từ localStorage
4. **API**: Các cấu hình được lưu thông qua API backend

## Xử Lý Lỗi

- **Lỗi kết nối**: Kiểm tra internet và API server
- **Lỗi xác thực**: Đăng nhập lại nếu token hết hạn
- **Lỗi lưu**: Kiểm tra dữ liệu đầu vào và thử lại

## Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra console browser để xem lỗi
2. Kiểm tra network tab để xem API calls
3. Liên hệ admin để được hỗ trợ 