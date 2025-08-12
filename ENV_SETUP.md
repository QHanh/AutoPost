# Cài đặt Biến Môi Trường

## Tổng quan
Dự án này đã được cập nhật để sử dụng biến môi trường thay vì hardcode URL API. Tất cả các file service và component đã được sửa để sử dụng `VITE_API_BASE_URL`.

## Biến môi trường cần thiết

### VITE_API_BASE_URL
- **Mô tả**: URL cơ sở của API backend
- **Giá trị mặc định**: `http://192.168.1.161:8000`
- **Ví dụ**: `http://localhost:8000` hoặc `https://api.example.com`

## Cách cài đặt

### 1. Tạo file .env.local (Khuyến nghị)
Tạo file `.env.local` trong thư mục gốc của dự án:

```bash
# .env.local
VITE_API_BASE_URL=http://192.168.1.161:8000
```

### 2. Tạo file .env (Thay thế)
Nếu không thể tạo `.env.local`, tạo file `.env`:

```bash
# .env
VITE_API_BASE_URL=http://192.168.1.161:8000
```

### 3. Cài đặt trong hệ thống
Có thể cài đặt biến môi trường trực tiếp trong hệ thống:

**Windows (PowerShell):**
```powershell
$env:VITE_API_BASE_URL="http://192.168.1.161:8000"
```

**Linux/macOS:**
```bash
export VITE_API_BASE_URL="http://192.168.1.161:8000"
```

## Các file đã được cập nhật

### Services
- `src/services/apiService.ts`
- `src/services/brandService.ts`
- `src/services/colorService.ts`
- `src/services/deviceApiService.ts`
- `src/services/deviceBrandService.ts`
- `src/services/deviceColorService.ts`
- `src/services/deviceInfoService.ts`
- `src/services/deviceService.ts`
- `src/services/deviceStorageService.ts`
- `src/services/storageService.ts`
- `src/services/warrantyService.ts`

### Components
- `src/components/DeviceFormModal.tsx`

### Pages
- `src/pages/ChatbotPage.tsx`
- `src/pages/ChatbotPage/ProductComponentsTab.tsx`
- `src/pages/ChatbotPage/DevicesTab.tsx`

## Cách hoạt động

Tất cả các file đã được cập nhật để sử dụng:

```typescript
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1`;
```

Điều này có nghĩa:
- Nếu biến môi trường `VITE_API_BASE_URL` được thiết lập, nó sẽ được sử dụng
- Nếu không, sẽ sử dụng giá trị mặc định `http://192.168.1.161:8000`

## Lưu ý quan trọng

1. **Vite**: Dự án sử dụng Vite, vì vậy tất cả biến môi trường phải bắt đầu bằng `VITE_`
2. **Restart**: Sau khi thay đổi biến môi trường, cần restart development server
3. **Git**: File `.env.local` thường được ignore bởi Git, đảm bảo bảo mật
4. **Production**: Đảm bảo thiết lập biến môi trường đúng trong môi trường production

## Kiểm tra cài đặt

Để kiểm tra xem biến môi trường đã được thiết lập đúng chưa, có thể:

1. Mở Developer Tools trong trình duyệt
2. Kiểm tra Console để xem có lỗi nào không
3. Kiểm tra Network tab để xem API calls có sử dụng đúng URL không

## Troubleshooting

### Biến môi trường không hoạt động
1. Đảm bảo file `.env.local` hoặc `.env` nằm trong thư mục gốc
2. Restart development server
3. Kiểm tra tên biến có đúng `VITE_API_BASE_URL` không

### API calls vẫn sử dụng URL cũ
1. Kiểm tra xem có file nào còn hardcode URL không
2. Clear browser cache
3. Restart development server 