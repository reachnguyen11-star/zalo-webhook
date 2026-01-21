# PowerShell Deployment Script for Windows
# Usage: .\deploy.ps1

$VPS_IP = "159.223.43.66"
$DOMAIN = "zalo.adzio.vn"
$VPS_USER = "root"
$APP_DIR = "/var/www/zalo-webhook"

Write-Host "🚀 Starting deployment to $DOMAIN ($VPS_IP)..." -ForegroundColor Green

# Check if we can SSH
Write-Host "`n📡 Testing SSH connection..." -ForegroundColor Yellow
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes $VPS_USER@$VPS_IP "echo 'OK'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to VPS. Please ensure:" -ForegroundColor Red
    Write-Host "  1. You can SSH: ssh root@$VPS_IP" -ForegroundColor Red
    Write-Host "  2. SSH key is configured or use password authentication" -ForegroundColor Red
    exit 1
}
Write-Host "✅ SSH connection successful!" -ForegroundColor Green

# Install environment on VPS
Write-Host "`n📦 Installing environment on VPS..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_IP @"
set -e
echo '📦 Installing Node.js...'
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs git

echo '📦 Installing PM2...'
sudo npm install -g pm2

echo '📦 Installing Nginx...'
sudo apt install -y nginx

echo '📦 Installing Certbot...'
sudo apt install -y certbot python3-certbot-nginx

echo '✅ Environment setup complete!'
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install environment" -ForegroundColor Red
    exit 1
}

# Create app directory
Write-Host "`n📁 Creating app directory..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_IP "mkdir -p $APP_DIR"

# Upload code using scp (if available) or manual instruction
Write-Host "`n📤 Uploading code to VPS..." -ForegroundColor Yellow

# Check if OpenSSH is available
$scpAvailable = Get-Command scp -ErrorAction SilentlyContinue

if ($scpAvailable) {
    # Use rsync-like approach with scp
    $excludes = @("node_modules", ".git", "clients.json", "*.log")

    Write-Host "Creating temporary archive..." -ForegroundColor Yellow
    $tempZip = "$env:TEMP\zalo-webhook.zip"

    # Get all files except excludes
    $files = Get-ChildItem -Path . -Recurse | Where-Object {
        $item = $_
        $shouldExclude = $false
        foreach ($exclude in $excludes) {
            if ($item.FullName -like "*$exclude*") {
                $shouldExclude = $true
                break
            }
        }
        -not $shouldExclude
    }

    Compress-Archive -Path * -DestinationPath $tempZip -Force -CompressionLevel Fastest

    Write-Host "Uploading archive..." -ForegroundColor Yellow
    scp $tempZip ${VPS_USER}@${VPS_IP}:${APP_DIR}/zalo-webhook.zip

    Write-Host "Extracting on VPS..." -ForegroundColor Yellow
    ssh $VPS_USER@$VPS_IP @"
cd $APP_DIR
apt install -y unzip
unzip -o zalo-webhook.zip
rm zalo-webhook.zip
"@

    Remove-Item $tempZip -Force
} else {
    Write-Host "⚠️  SCP not available. Please upload code manually:" -ForegroundColor Yellow
    Write-Host "   1. Use WinSCP to upload G:\CODE\Zalo_auto to VPS:$APP_DIR" -ForegroundColor Cyan
    Write-Host "   2. Or push to GitHub and clone on VPS" -ForegroundColor Cyan
    Write-Host "`nPress Enter after you've uploaded the code..." -ForegroundColor Yellow
    Read-Host
}

# Configure Nginx
Write-Host "`n🔧 Configuring Nginx..." -ForegroundColor Yellow
$nginxConfig = @"
server {
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }
}
"@

$nginxConfig | ssh $VPS_USER@$VPS_IP "cat > /etc/nginx/sites-available/zalo-webhook"

ssh $VPS_USER@$VPS_IP @"
ln -sf /etc/nginx/sites-available/zalo-webhook /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
"@

# Install dependencies and start app
Write-Host "`n🚀 Installing dependencies and starting app..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_IP @"
cd $APP_DIR
npm install
npm run build
pm2 delete zalo-webhook 2>/dev/null || true
pm2 start dist/index.js --name zalo-webhook
pm2 save
pm2 startup | tail -n 1 | bash
"@

# Setup SSL
Write-Host "`n🔒 Setting up SSL certificate..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_IP "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email || echo 'SSL setup may require manual configuration'"

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n🌐 Your webhook URL: https://$DOMAIN/webhook/zalo?client_id=vietcapitalland_hftc" -ForegroundColor Cyan
Write-Host "🎛️  Admin dashboard: https://$DOMAIN/admin" -ForegroundColor Cyan
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. SSH to VPS: ssh root@$VPS_IP" -ForegroundColor White
Write-Host "2. Update .env: cd $APP_DIR && nano .env" -ForegroundColor White
Write-Host "3. Set GOOGLE_REDIRECT_URI=https://$DOMAIN/auth/google/callback" -ForegroundColor White
Write-Host "4. Restart: pm2 restart zalo-webhook" -ForegroundColor White
Write-Host "`n🔧 Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs: ssh root@$VPS_IP 'pm2 logs zalo-webhook'" -ForegroundColor White
Write-Host "  Restart: ssh root@$VPS_IP 'pm2 restart zalo-webhook'" -ForegroundColor White
