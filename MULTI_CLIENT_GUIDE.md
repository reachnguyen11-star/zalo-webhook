# Multi-Client Zalo Ads to Google Sheets - User Guide

## Overview

Hệ thống multi-client cho phép bạn quản lý nhiều khách hàng (OAs) khác nhau, mỗi khách hàng có Google Sheet riêng và OAuth tokens riêng.

## Quick Start

### 1. Khởi động server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

### 2. Truy cập Admin Dashboard

Mở trình duyệt và vào: `http://localhost:3000/admin`

**Đăng nhập với Bearer Token:**
- Thêm header: `Authorization: Bearer admin123`
- Hoặc dùng curl:
  ```bash
  curl -H "Authorization: Bearer admin123" http://localhost:3000/admin
  ```

### 3. Thêm Client Mới

Trên Admin Dashboard:

1. Click nút **"Add New Client"**
2. Nhập thông tin:
   - **Client Name**: Tên khách hàng (VD: "Khach_Hang_A")
   - **Google Sheet ID**: ID của Google Spreadsheet
     - Copy từ URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Click **"Create Client"**

### 4. Authorize Google OAuth cho Client

Sau khi tạo client:

1. Click nút **"Authorize"** bên cạnh client vừa tạo
2. Bạn sẽ được redirect đến Google consent screen
3. Chọn tài khoản Google và **Allow** permissions
4. Sau khi authorize thành công, quay lại Admin Dashboard

### 5. Lấy Webhook URL

Mỗi client có webhook URL riêng:

```
http://localhost:3000/webhook/zalo?client_id={CLIENT_ID}
```

**Lưu ý:** Trong production, thay `localhost:3000` bằng domain thực hoặc ngrok URL.

Example:
```
https://abc123.ngrok.io/webhook/zalo?client_id=khach-hang-a-x7k9
```

### 6. Cấu hình Zalo OA

Trong Zalo Developer Portal:

1. Vào **Cài đặt webhook**
2. Paste webhook URL (có `client_id` parameter)
3. Subscribe vào event **"form_submit"**
4. Save changes

## Admin Dashboard Features

### Client List

Hiển thị tất cả clients với thông tin:
- **Client ID**: ID duy nhất của client
- **Client Name**: Tên khách hàng
- **Google Sheet ID**: ID của spreadsheet
- **Status**: Trạng thái OAuth (Authenticated/Not Authenticated)
- **Actions**:
  - **Authorize**: Kết nối Google OAuth
  - **Copy Webhook URL**: Copy URL để paste vào Zalo
  - **Delete**: Xóa client

### API Endpoints

#### List All Clients
```bash
curl -H "Authorization: Bearer admin123" \
  http://localhost:3000/admin/clients
```

#### Create New Client
```bash
curl -X POST http://localhost:3000/admin/clients \
  -H "Authorization: Bearer admin123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Khach Hang B",
    "googleSheetId": "1abc123def456..."
  }'
```

#### Delete Client
```bash
curl -X DELETE http://localhost:3000/admin/clients/khach-hang-b-a8j2 \
  -H "Authorization: Bearer admin123"
```

## Testing Workflow

### Test cho 1 client

1. **Tạo client mới:**
   ```bash
   curl -X POST http://localhost:3000/admin/clients \
     -H "Authorization: Bearer admin123" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Client",
       "googleSheetId": "YOUR_SHEET_ID"
     }'
   ```

2. **Authorize Google OAuth:**
   - Vào `http://localhost:3000/auth/google?client_id=test-client-xxxx`
   - Allow permissions

3. **Test webhook:**
   ```bash
   curl -X POST "http://localhost:3000/webhook/zalo?client_id=test-client-xxxx" \
     -H "Content-Type: application/json" \
     -d '{
       "event_name": "form_submit",
       "data": {
         "fields": [
           {"name": "Name", "value": "Nguyen Van A"},
           {"name": "Phone", "value": "0901234567"},
           {"name": "Email", "value": "test@example.com"}
         ]
       }
     }'
   ```

4. **Verify trong Google Sheet:**
   - Mở Google Sheet của client
   - Check xem lead đã được thêm vào chưa

## Production Deployment

### 1. Setup ngrok

```bash
ngrok http 3000
```

Copy ngrok URL (VD: `https://abc123.ngrok.io`)

### 2. Update Google OAuth Redirect URI

Trong Google Cloud Console:
1. Vào **OAuth 2.0 Client IDs**
2. Add redirect URI: `https://abc123.ngrok.io/oauth2callback`
3. Save

### 3. Update .env

```env
GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/oauth2callback
ADMIN_PASSWORD=your_secure_password_here
```

### 4. Restart server

```bash
npm run dev
```

### 5. Cung cấp webhook URL cho Zalo

Format: `https://abc123.ngrok.io/webhook/zalo?client_id={CLIENT_ID}`

## Troubleshooting

### Client không được authenticate

**Giải pháp:**
1. Xóa client cũ và tạo lại
2. Click "Authorize" lại
3. Check logs: `npm run dev`

### Duplicate leads vẫn được thêm

**Giải pháp:**
- Check cột "Phone" trong Google Sheet
- Đảm bảo phone được format là text (có dấu `'` ở đầu)
- Re-authorize client

### Webhook 404 Not Found

**Giải pháp:**
- Check `client_id` parameter có đúng không
- Verify client tồn tại: `GET /admin/clients`
- Check logs

### OAuth callback 404

**Giải pháp:**
- Check redirect URI trong Google Cloud Console
- Phải match với `GOOGLE_REDIRECT_URI` trong `.env`
- Restart server sau khi update `.env`

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Admin Password:**
   - Đổi `ADMIN_PASSWORD` trong `.env` thành password mạnh
   - Không commit `.env` vào git

2. **Production Setup:**
   - Dùng HTTPS (ngrok hoặc domain thực)
   - Setup rate limiting cho webhook endpoint
   - Monitor logs để phát hiện abuse

3. **OAuth Tokens:**
   - Tokens được lưu trong `clients.json`
   - **Không commit** file này vào git
   - Backup file này thường xuyên

## Support

Nếu có vấn đề:
1. Check server logs
2. Verify client configuration
3. Test webhook với curl command
4. Check Google Sheet permissions

---

**Happy Lead Management! 🚀**
