# Zalo Ads to Google Sheets Integration

Tự động đẩy leads real-time từ Zalo Ads Form về Google Sheets với xử lý deduplication theo số điện thoại.

## Tính năng

- ✅ **Real-time webhook** - Nhận leads ngay khi user submit form
- ✅ **Tự động đẩy về Google Sheets** - Không cần can thiệp thủ công
- ✅ **Đầy đủ thông tin** - Capture tất cả các field trong Zalo Form
- ✅ **Lọc trùng thông minh** - Tự động skip leads trùng số điện thoại
- ✅ **OAuth2 bảo mật** - User tự authorize truy cập vào Sheets của mình
- ✅ **Logging chi tiết** - Track tất cả events và errors

## Yêu cầu

- Node.js 18+ và npm
- Zalo Developer App (App ID, App Secret)
- Google Cloud Project với Google Sheets API enabled
- ngrok (để expose local webhook cho testing)

## Cài đặt nhanh

### 1. Clone và install dependencies

```bash
cd Zalo_auto
npm install
```

### 2. Cấu hình environment variables

```bash
# Copy file .env.example thành .env
copy .env.example .env

# Chỉnh sửa .env với credentials của bạn
```

### 3. Setup Google OAuth

Xem hướng dẫn chi tiết trong [SETUP.md](SETUP.md#google-oauth-setup)

Tóm tắt:
1. Tạo project tại [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Sheets API
3. Tạo OAuth 2.0 credentials
4. Điền Client ID và Client Secret vào `.env`

### 4. Setup Zalo App

Xem hướng dẫn chi tiết trong [SETUP.md](SETUP.md#zalo-developer-setup)

Tóm tắt:
1. Tạo app tại [Zalo Developers](https://developers.zalo.me/)
2. Lấy App ID và App Secret
3. Điền thông tin vào `.env`
4. Cấu hình webhook URL (sau khi start server)

### 5. Chạy ứng dụng

```bash
# Development mode với auto-reload
npm run dev

# Production mode
npm run build
npm start
```

Server sẽ chạy tại `http://localhost:3000`

### 6. Authorize Google Sheets

1. Mở browser và truy cập: `http://localhost:3000/auth/google`
2. Click "Authorize with Google"
3. Đăng nhập và cấp quyền truy cập Google Sheets
4. Sau khi authorize thành công, server sẵn sàng nhận leads

### 7. Expose webhook với ngrok

```bash
# Install ngrok nếu chưa có
# https://ngrok.com/download

# Expose local server
ngrok http 3000
```

Copy ngrok URL (ví dụ: `https://abc123.ngrok.io`) và cấu hình trong Zalo Developer Portal.

### 8. Cấu hình webhook trong Zalo

1. Truy cập [Zalo Developers](https://developers.zalo.me/)
2. Chọn app của bạn
3. Vào Settings > Webhooks
4. Webhook URL: `https://your-ngrok-url.ngrok.io/webhook/zalo`
5. Subscribe events: Form submission
6. Save và verify webhook

## Cấu trúc Google Sheets

Ứng dụng sẽ tự động tạo headers nếu sheet trống. Format mẫu:

| Timestamp | Name | Phone | Email | ... | Source |
|-----------|------|-------|-------|-----|--------|
| 2024-01-20T10:30:00.000Z | Nguyen Van A | 0901234567 | test@example.com | ... | Zalo Ads |

- **Dynamic headers**: Headers sẽ tự động match với fields trong Zalo Form
- **Phone normalization**: Tất cả số điện thoại được chuẩn hóa về format `0xxxxxxxxx`
- **Deduplication**: Dựa vào cột Phone (column C)

## API Endpoints

### Health Check
```
GET /health
```
Kiểm tra trạng thái server và Google Sheets connection.

### Google OAuth
```
GET /auth/google        # Initiate OAuth flow
GET /oauth2callback     # OAuth callback
GET /auth/status        # Check auth status
```

### Webhook
```
GET  /webhook/zalo      # Webhook verification
POST /webhook/zalo      # Receive Zalo form submissions
```

## Troubleshooting

### Server không start được

```bash
# Kiểm tra .env file
cat .env

# Kiểm tra Node.js version
node --version  # Cần >= 18

# Xóa node_modules và reinstall
rm -rf node_modules
npm install
```

### Google Sheets authentication failed

- Kiểm tra GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET
- Đảm bảo redirect URI trong Google Console match với `.env`
- Xóa file `tokens.json` và authorize lại

### Webhook không nhận được data

- Kiểm tra ngrok đang chạy và URL chính xác
- Verify webhook URL trong Zalo Developer Portal
- Check logs để xem lỗi: `npm run dev`
- Test webhook với curl:

```bash
curl -X POST http://localhost:3000/webhook/zalo \
  -H "Content-Type: application/json" \
  -d '{"event_name":"form_submit","data":{"fields":[{"name":"phone","value":"0901234567"}]}}'
```

### Leads bị duplicate

- Kiểm tra xem phone column có đúng index không (default: column C)
- Xem logs để biết phone nào bị duplicate
- Đảm bảo sheet không có nhiều tabs

## Development

### Project Structure

```
Zalo_auto/
├── src/
│   ├── config/           # Configuration files
│   │   ├── env.config.ts
│   │   ├── google-auth.ts
│   │   └── zalo-config.ts
│   ├── controllers/      # Route controllers
│   │   └── webhook.controller.ts
│   ├── middleware/       # Express middlewares
│   │   ├── error-handler.ts
│   │   └── logger.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   └── webhook.routes.ts
│   ├── services/        # Business logic
│   │   ├── lead-processor.service.ts
│   │   ├── sheets.service.ts
│   │   └── zalo.service.ts
│   ├── utils/           # Utilities
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── phone-normalizer.ts
│   └── index.ts         # Application entry point
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts

```bash
npm run dev      # Development với auto-reload
npm run build    # Build TypeScript to JavaScript
npm start        # Run production build
```

## Bảo mật

- ✅ Webhook signature verification (nếu Zalo cung cấp)
- ✅ OAuth2 cho Google Sheets access
- ✅ Environment variables cho sensitive data
- ✅ HTTPS thông qua ngrok
- ⚠️ **Lưu ý**: Không commit file `.env` hoặc `tokens.json` lên Git

## Support

Nếu gặp vấn đề, hãy:
1. Check logs trong console
2. Xem [SETUP.md](SETUP.md) để biết chi tiết setup
3. Xem [API.md](API.md) để hiểu webhook payload format

## License

MIT
