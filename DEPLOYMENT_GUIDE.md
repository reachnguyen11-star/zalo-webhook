# 🚀 Hướng dẫn Deploy lên VPS DigitalOcean

## Yêu cầu trước khi deploy

1. ✅ VPS DigitalOcean (Ubuntu 20.04/22.04)
2. ✅ Subdomain đã trỏ về IP VPS (ví dụ: api.adzio.vn)
3. ✅ SSH key hoặc password để truy cập VPS

## Bước 1: Trỏ subdomain

Vào quản lý DNS của `adzio.vn` và thêm:

```
Type: A Record
Name: api (hoặc webhook, zalo - tùy chọn)
Value: <IP-VPS-của-bạn>
TTL: 300
```

Chờ 5-10 phút để DNS propagate.

## Bước 2: Deploy bằng script tự động

**Trên Windows (Git Bash hoặc WSL):**

```bash
cd G:\CODE\Zalo_auto

# Chạy deploy script
bash deploy.sh <VPS-IP> <subdomain>

# Ví dụ:
bash deploy.sh 159.65.123.456 api.adzio.vn
```

Script sẽ tự động:
- ✅ Cài Node.js, PM2, Nginx, Certbot
- ✅ Upload code lên VPS
- ✅ Cài dependencies
- ✅ Build TypeScript
- ✅ Cấu hình Nginx reverse proxy
- ✅ Cài SSL certificate (HTTPS)
- ✅ Chạy app với PM2 (auto-restart)

## Bước 3: Cập nhật .env file trên VPS

Sau khi deploy xong, SSH vào VPS và cập nhật file .env:

```bash
ssh root@<VPS-IP>
cd /var/www/zalo-webhook
nano .env
```

Cập nhật dòng sau:

```env
GOOGLE_REDIRECT_URI=https://api.adzio.vn/auth/google/callback
```

Sau đó restart app:

```bash
pm2 restart zalo-webhook
```

## Bước 4: Xác thực domain trong Zalo Developer Portal

1. Vào **Zalo Developer Portal** → Chọn app
2. Vào phần **"Xác thực domain"**
3. Thêm domain: `api.adzio.vn`
4. Làm theo hướng dẫn verify (thường là thêm DNS TXT record hoặc upload file verification)

## Bước 5: Cấu hình Webhook trong Zalo

Webhook URL:
```
https://api.adzio.vn/webhook/zalo?client_id=vietcapitalland_hftc
```

## URLs sau khi deploy

- **Admin Dashboard**: https://api.adzio.vn/admin
- **Webhook URL**: https://api.adzio.vn/webhook/zalo?client_id=vietcapitalland_hftc
- **OAuth Callback**: https://api.adzio.vn/auth/google/callback

## Lệnh quản lý hữu ích

```bash
# Xem logs
ssh root@<VPS-IP> "pm2 logs zalo-webhook"

# Restart app
ssh root@<VPS-IP> "pm2 restart zalo-webhook"

# Check status
ssh root@<VPS-IP> "pm2 status"

# Stop app
ssh root@<VPS-IP> "pm2 stop zalo-webhook"

# Update code (sau khi sửa local)
rsync -avz --exclude 'node_modules' ./ root@<VPS-IP>:/var/www/zalo-webhook/
ssh root@<VPS-IP> "cd /var/www/zalo-webhook && npm run build && pm2 restart zalo-webhook"
```

## Troubleshooting

### SSL certificate failed
Nếu SSL tự động thất bại, chạy manual:

```bash
ssh root@<VPS-IP>
sudo certbot --nginx -d api.adzio.vn
```

### App không chạy
Check logs:

```bash
ssh root@<VPS-IP> "pm2 logs zalo-webhook --lines 100"
```

### Nginx error
Check Nginx logs:

```bash
ssh root@<VPS-IP> "sudo tail -f /var/log/nginx/error.log"
```

## Lưu ý quan trọng

1. **clients.json** không được upload lên VPS (đã exclude trong script)
   - Bạn cần tạo client mới trên VPS qua admin dashboard
   - Hoặc manual copy file clients.json từ local

2. **.env file** cần cập nhật `GOOGLE_REDIRECT_URI` thành domain production

3. **Google OAuth credentials** cần thêm redirect URI:
   - Vào Google Cloud Console
   - Thêm: `https://api.adzio.vn/auth/google/callback`

4. **Firewall**: Đảm bảo port 80 và 443 đã mở trên DigitalOcean

## Bảo mật

- ✅ HTTPS đã được cài tự động (Let's Encrypt)
- ✅ PM2 tự động restart khi crash
- ⚠️  Nên đổi ADMIN_PASSWORD trong .env file
- ⚠️  Nên setup firewall (ufw) để chỉ cho phép port 22, 80, 443
