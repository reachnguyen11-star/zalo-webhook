#!/bin/bash

# Zalo Webhook Deployment Script for DigitalOcean VPS
# Usage: bash deploy.sh <your-vps-ip> <your-subdomain>
# Example: bash deploy.sh 159.65.xxx.xxx api.adzio.vn

set -e

if [ "$#" -ne 2 ]; then
    echo "Usage: bash deploy.sh <vps-ip> <subdomain>"
    echo "Example: bash deploy.sh 159.65.xxx.xxx api.adzio.vn"
    exit 1
fi

VPS_IP=$1
DOMAIN=$2
APP_DIR="/var/www/zalo-webhook"

echo "🚀 Starting deployment to $DOMAIN ($VPS_IP)..."

# Create temporary setup script
cat > /tmp/setup-vps.sh << 'SCRIPT_END'
#!/bin/bash
set -e

echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs git

echo "📦 Installing PM2..."
sudo npm install -g pm2

echo "📦 Installing Nginx..."
sudo apt install -y nginx

echo "📦 Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

echo "✅ Environment setup complete!"
SCRIPT_END

# Upload and run setup script
echo "📤 Uploading setup script..."
scp /tmp/setup-vps.sh root@$VPS_IP:/tmp/
ssh root@$VPS_IP "bash /tmp/setup-vps.sh"

# Create app directory
echo "📁 Creating app directory..."
ssh root@$VPS_IP "mkdir -p $APP_DIR"

# Upload code
echo "📤 Uploading application code..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'clients.json' \
  ./ root@$VPS_IP:$APP_DIR/

# Create Nginx config
echo "🔧 Configuring Nginx..."
cat > /tmp/nginx-config << NGINX_END
server {
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_END

scp /tmp/nginx-config root@$VPS_IP:/tmp/
ssh root@$VPS_IP << REMOTE_COMMANDS
# Enable Nginx config
sudo mv /tmp/nginx-config /etc/nginx/sites-available/zalo-webhook
sudo ln -sf /etc/nginx/sites-available/zalo-webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install dependencies and build
cd $APP_DIR
npm install
npm run build

# Start with PM2
pm2 delete zalo-webhook 2>/dev/null || true
pm2 start dist/index.js --name zalo-webhook
pm2 save
pm2 startup | tail -n 1 | bash

echo "✅ Application deployed!"
REMOTE_COMMANDS

# Setup SSL
echo "🔒 Setting up SSL certificate..."
ssh root@$VPS_IP "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo 'SSL setup failed, you may need to run certbot manually'"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your webhook URL: https://$DOMAIN/webhook/zalo?client_id=vietcapitalland_hftc"
echo "🎛️  Admin dashboard: https://$DOMAIN/admin"
echo ""
echo "📝 Next steps:"
echo "1. Update .env file on VPS with correct GOOGLE_REDIRECT_URI"
echo "   SSH command: ssh root@$VPS_IP"
echo "   Then: cd $APP_DIR && nano .env"
echo "   Update: GOOGLE_REDIRECT_URI=https://$DOMAIN/auth/google/callback"
echo ""
echo "2. Verify domain in Zalo Developer Portal"
echo "3. Add webhook URL to Zalo OA settings"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: ssh root@$VPS_IP 'pm2 logs zalo-webhook'"
echo "   Restart app: ssh root@$VPS_IP 'pm2 restart zalo-webhook'"
echo "   Check status: ssh root@$VPS_IP 'pm2 status'"
