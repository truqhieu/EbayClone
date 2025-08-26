# Hướng Dẫn Deploy Backend và Frontend lên Vercel

## Tổng Quan
Project này bao gồm:
- **Backend**: Node.js/Express API server với MongoDB
- **Frontend**: React application với Tailwind CSS

## Bước 1: Chuẩn Bị

### 1.1 Cài đặt Vercel CLI
```bash
npm install -g vercel
```

### 1.2 Đăng nhập Vercel
```bash
vercel login
```

## Bước 2: Deploy Backend

### 2.1 Chuyển đến thư mục backend
```bash
cd back-end
```

### 2.2 Thiết lập Environment Variables cho Backend
Trên Vercel dashboard, thiết lập các biến môi trường sau:

**Bắt buộc:**
- `PORT` = `3001` (hoặc port khác)
- `MONGO_URI` = `mongodb+srv://username:password@cluster.mongodb.net/database`
- `CLIENT_URL` = `https://your-frontend-domain.vercel.app`

**Tùy chọn (tùy thuộc vào features bạn sử dụng):**
- `JWT_SECRET` = `your-jwt-secret-key`
- `CLOUDINARY_CLOUD_NAME` = `your-cloudinary-name`
- `CLOUDINARY_API_KEY` = `your-cloudinary-api-key`
- `CLOUDINARY_API_SECRET` = `your-cloudinary-api-secret`
- `PAYPAL_CLIENT_ID` = `your-paypal-client-id`
- `PAYPAL_CLIENT_SECRET` = `your-paypal-client-secret`
- `EMAIL_USER` = `your-email@gmail.com`
- `EMAIL_PASS` = `your-email-app-password`

### 2.3 Deploy Backend
```bash
vercel --prod
```

## Bước 3: Deploy Frontend

### 3.1 Chuyển đến thư mục frontend
```bash
cd ../front-end
```

### 3.2 Thiết lập Environment Variables cho Frontend
Tạo file `.env` trong thư mục `front-end`:

```env
REACT_APP_API_URL=https://your-backend-domain.vercel.app/api
REACT_APP_SOCKET_URL=https://your-backend-domain.vercel.app
```

**Trên Vercel dashboard, thiết lập:**
- `REACT_APP_API_URL` = `https://your-backend-domain.vercel.app/api`
- `REACT_APP_SOCKET_URL` = `https://your-backend-domain.vercel.app`

### 3.3 Deploy Frontend
```bash
vercel --prod
```

## Bước 4: Cấu Hình CORS

Sau khi deploy, cập nhật CORS trong backend để cho phép frontend domain:

1. Vào Vercel dashboard của backend
2. Cập nhật environment variable `CLIENT_URL` với URL của frontend
3. Redeploy backend

## Bước 5: Kiểm Tra

### 5.1 Kiểm tra Backend
- Truy cập `https://your-backend-domain.vercel.app`
- Kiểm tra API endpoints: `https://your-backend-domain.vercel.app/api`

### 5.2 Kiểm tra Frontend
- Truy cập `https://your-frontend-domain.vercel.app`
- Kiểm tra kết nối với backend API

## Lưu Ý Quan Trọng

### Backend:
1. **MongoDB Connection**: Đảm bảo MongoDB Atlas được cấu hình để cho phép kết nối từ mọi IP (0.0.0.0/0) hoặc thêm Vercel IPs
2. **Socket.IO**: WebSocket có thể cần cấu hình bổ sung cho Vercel
3. **File Upload**: Nếu sử dụng multer, nên chuyển sang Cloudinary hoặc AWS S3

### Frontend:
1. **Environment Variables**: Tất cả biến môi trường phải bắt đầu với `REACT_APP_`
2. **API URLs**: Đảm bảo tất cả API calls sử dụng absolute URLs
3. **Routing**: React Router được cấu hình tự động với vercel.json

## Troubleshooting

### Lỗi thường gặp:

1. **CORS Error**: Kiểm tra CLIENT_URL trong backend environment variables
2. **API Connection Failed**: Kiểm tra REACT_APP_API_URL trong frontend
3. **MongoDB Connection**: Kiểm tra MONGO_URI và network access settings
4. **Build Failed**: Kiểm tra dependencies và build scripts

### Logs:
- Backend logs: `vercel logs https://your-backend-domain.vercel.app`
- Frontend logs: Kiểm tra trong Vercel dashboard

## Commands Hữu Ích

```bash
# Deploy với domain tùy chỉnh
vercel --prod --name your-custom-name

# Xem logs
vercel logs

# Xem thông tin project
vercel ls

# Remove deployment
vercel remove
```

## Cấu Hình Domain Tùy Chỉnh (Tùy chọn)

1. Vào Vercel dashboard
2. Chọn project → Settings → Domains
3. Thêm custom domain
4. Cập nhật DNS records theo hướng dẫn

---

**Lưu ý**: Sau khi deploy thành công, nhớ cập nhật tất cả hardcoded URLs trong code để sử dụng environment variables.