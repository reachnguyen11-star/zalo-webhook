# Setup Guide - Zalo Ads to Google Sheets

Hướng dẫn chi tiết từng bước để setup hệ thống Zalo Ads to Google Sheets.

## Mục lục

1. [Google Cloud Console Setup](#1-google-cloud-console-setup)
2. [Zalo Developer Portal Setup](#2-zalo-developer-portal-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Google Sheets Preparation](#4-google-sheets-preparation)
5. [Webhook Configuration](#5-webhook-configuration)
6. [Testing](#6-testing)

---

## 1. Google Cloud Console Setup

### Bước 1.1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** > **New Project**
3. Nhập project name (ví dụ: "Zalo Ads Integration")
4. Click **Create**

### Bước 1.2: Enable Google Sheets API

1. Trong project vừa tạo, vào menu **APIs & Services** > **Library**
2. Tìm kiếm "Google Sheets API"
3. Click vào **Google Sheets API**
4. Click **Enable**

### Bước 1.3: Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Nếu chưa có OAuth consent screen:
   - Click **Configure Consent Screen**
   - Chọn **External** (cho testing) hoặc **Internal** (nếu dùng Google Workspace)
   - Nhập App name: "Zalo Ads to Sheets"
   - User support email: email của bạn
   - Developer contact: email của bạn
   - Click **Save and Continue**
   - Scopes: Click **Add or Remove Scopes**, tìm và thêm:
     - `https://www.googleapis.com/auth/spreadsheets`
   - Click **Update** > **Save and Continue**
   - Test users (cho External): Add email bạn sẽ dùng để test
   - Click **Save and Continue**

4. Quay lại **Credentials** > **Create Credentials** > **OAuth client ID**
5. Application type: **Web application**
6. Name: "Zalo Ads OAuth Client"
7. Authorized redirect URIs, click **Add URI**:
   ```
   http://localhost:3000/oauth2callback
   ```
8. Click **Create**
9. **QUAN TRỌNG**: Copy **Client ID** và **Client Secret** - bạn sẽ cần paste vào file `.env`

### Bước 1.4: Lưu credentials

```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## 2. Zalo Developer Portal Setup

### Bước 2.1: Truy cập Zalo Developers

1. Truy cập [https://developers.zalo.me/](https://developers.zalo.me/)
2. Đăng nhập bằng tài khoản Zalo của bạn
3. Nếu chưa có developer account, làm theo hướng dẫn để đăng ký

### Bước 2.2: Tạo hoặc chọn App

Nếu bạn đã có app:
1. Vào **My Apps** và chọn app của bạn
2. Lấy **App ID** và **App Secret** từ trang Settings

Nếu chưa có app:
1. Click **Create App** hoặc **Add New App**
2. Chọn loại app phù hợp (thường là **Official Account** hoặc **Mini App**)
3. Điền thông tin:
   - App name
   - Description
   - Category
4. Click **Create**
5. Vào **Settings** để lấy **App ID** và **App Secret**

### Bước 2.3: Lấy App Credentials

1. Trong app dashboard, vào **Settings** hoặc **App Credentials**
2. Copy:
   - **App ID**: Một số dạng `1234567890123456789`
   - **App Secret**: Một chuỗi ký tự dài
3. Paste vào file `.env`:

```
ZALO_APP_ID=your_app_id_here
ZALO_APP_SECRET=your_app_secret_here
```

### Bước 2.4: Tạo Webhook Secret (nếu có)

Một số Zalo app yêu cầu webhook verification token:
1. Trong app settings, tìm phần **Webhook** hoặc **Verification Token**
2. Tạo một secret key bất kỳ (ví dụ: `my_webhook_secret_key_123`)
3. Lưu vào `.env`:

```
ZALO_WEBHOOK_SECRET=my_webhook_secret_key_123
```

**Lưu ý**: Nếu Zalo không yêu cầu webhook secret, bạn vẫn nên set một giá trị bất kỳ trong `.env`.

---

## 3. Environment Configuration

### Bước 3.1: Tạo file .env

```bash
# Copy template
copy .env.example .env
```

### Bước 3.2: Điền đầy đủ thông tin

Mở file `.env` và điền:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Zalo Configuration
ZALO_APP_ID=1234567890123456789
ZALO_APP_SECRET=abc123xyz456def789
ZALO_WEBHOOK_SECRET=my_webhook_secret_key_123

# Google Sheets Configuration
GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz456
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

# Your Google Spreadsheet ID
# Lấy từ URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
SPREADSHEET_ID=1ABC2DEF3GHI4JKL5MNO6PQR7STU8VWX9YZ

# Optional
LOG_LEVEL=info
```

### Bước 3.3: Lấy Spreadsheet ID

1. Mở Google Sheets của bạn
2. Copy URL, ví dụ:
   ```
   https://docs.google.com/spreadsheets/d/1ABC2DEF3GHI4JKL5MNO6PQR7STU8VWX9YZ/edit#gid=0
   ```
3. Spreadsheet ID là phần giữa `/d/` và `/edit`:
   ```
   1ABC2DEF3GHI4JKL5MNO6PQR7STU8VWX9YZ
   ```
4. Paste vào `SPREADSHEET_ID` trong `.env`

---

## 4. Google Sheets Preparation

### Bước 4.1: Tạo Google Sheet

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo spreadsheet mới
3. Đặt tên sheet (ví dụ: "Zalo Leads")
4. Sheet sẽ tự động có tên tab là "Sheet1" - **ĐỪNG ĐỔI TÊN** (code mặc định dùng Sheet1)

### Bước 4.2: Chuẩn bị headers (Optional)

Bạn có thể:
- **Để trống** - App sẽ tự động tạo headers khi có lead đầu tiên
- **Hoặc tự tạo headers** theo format:

| Timestamp | Name | Phone | Email | form_id | zalo_user_id | Source |
|-----------|------|-------|-------|---------|--------------|--------|

**Lưu ý**: Column thứ 3 (C) phải là **Phone** để deduplication hoạt động.

### Bước 4.3: Share sheet (nếu cần)

Nếu bạn muốn share với team:
1. Click **Share** button
2. Add email addresses
3. Set permissions (Viewer/Editor)

---

## 5. Webhook Configuration

### Bước 5.1: Start local server

```bash
npm install
npm run dev
```

Server chạy tại: `http://localhost:3000`

### Bước 5.2: Authorize Google Sheets

1. Mở browser: `http://localhost:3000/auth/google`
2. Click **Authorize with Google**
3. Đăng nhập Google account (account có quyền truy cập sheet)
4. Click **Allow** để cấp quyền
5. Thấy message "✓ Authorization Successful!" là OK
6. File `tokens.json` sẽ được tạo trong thư mục gốc

### Bước 5.3: Install và chạy ngrok

1. Download ngrok: [https://ngrok.com/download](https://ngrok.com/download)
2. Extract và chạy:

```bash
ngrok http 3000
```

3. Copy **Forwarding URL**, ví dụ:
   ```
   Forwarding   https://abc123xyz.ngrok.io -> http://localhost:3000
   ```

### Bước 5.4: Cấu hình webhook trong Zalo

1. Vào Zalo Developer Portal
2. Chọn app của bạn
3. Vào **Settings** > **Webhooks** (hoặc tương tự)
4. Webhook URL:
   ```
   https://abc123xyz.ngrok.io/webhook/zalo
   ```
5. **Events to subscribe**:
   - Form submission
   - Follow (nếu có)
   - Message (nếu cần)
6. Click **Verify** hoặc **Save**
7. Zalo sẽ gửi GET request để verify - nếu thành công sẽ thấy checkmark

---

## 6. Testing

### Bước 6.1: Test webhook với curl

```bash
curl -X POST http://localhost:3000/webhook/zalo \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "form_submit",
    "app_id": "123456789",
    "timestamp": "2024-01-20T10:00:00Z",
    "data": {
      "form_id": "test_form_001",
      "submit_time": 1705745000000,
      "fields": [
        {"name": "Name", "value": "Nguyen Van A", "type": "text"},
        {"name": "Phone", "value": "0901234567", "type": "text"},
        {"name": "Email", "value": "test@example.com", "type": "email"}
      ]
    }
  }'
```

Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Lead successfully added to Google Sheets",
  "isDuplicate": false
}
```

Kiểm tra Google Sheets - lead mới phải xuất hiện!

### Bước 6.2: Test duplicate detection

Gửi lại request trên với cùng phone number:

```bash
# Gửi lại cùng request
curl -X POST http://localhost:3000/webhook/zalo ...
```

Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Duplicate phone number, skipped",
  "isDuplicate": true
}
```

Sheet không thêm row mới!

### Bước 6.3: Test với Zalo Form thật

1. Tạo Zalo Ads campaign với Form
2. Submit form với thông tin test
3. Kiểm tra:
   - Logs trong terminal (server logs)
   - Google Sheets có lead mới
   - Webhook logs trong Zalo Developer Portal

### Bước 6.4: Check health

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "authenticated": true
}
```

---

## Common Issues

### Issue 1: "Environment variable XXX is required"

**Solution**: Check file `.env` có đầy đủ các biến và đúng format không.

### Issue 2: Google OAuth error "redirect_uri_mismatch"

**Solution**:
- Check `GOOGLE_REDIRECT_URI` trong `.env` phải là `http://localhost:3000/oauth2callback`
- Check trong Google Console, Authorized redirect URIs phải có chính xác URL trên

### Issue 3: Webhook verification failed trong Zalo

**Solution**:
- Đảm bảo ngrok đang chạy
- URL trong Zalo phải đúng format: `https://xxx.ngrok.io/webhook/zalo`
- Server phải đang chạy (`npm run dev`)

### Issue 4: Leads không xuất hiện trong Sheets

**Solution**:
- Check `SPREADSHEET_ID` có đúng không
- Check sheet name là "Sheet1"
- Check account Google đã authorize có quyền Edit sheet không
- Xem logs để biết error

### Issue 5: tokens.json not found

**Solution**: Bạn chưa authorize Google OAuth. Visit `http://localhost:3000/auth/google`

---

## Next Steps

Sau khi setup thành công:

1. **Deploy to production**: Xem hướng dẫn deploy lên Railway, Render, hoặc VPS
2. **Setup monitoring**: Add health check và alerting
3. **Scale**: Nếu có nhiều clients, cần refactor để support multi-tenant
4. **Backup**: Định kỳ backup Google Sheets hoặc sync sang database

Chúc bạn thành công!
