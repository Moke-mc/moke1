#!/bin/bash

# ===========================================
# Vercel + 云服务器 - 后端部署脚本
# ===========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否是 root 用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 用户运行此脚本（sudo -i 切换）"
    exit 1
fi

echo ""
echo "=========================================="
echo "  教务系统后端部署"
echo "=========================================="
echo ""

# 步骤 1：更新系统
log_info "更新系统..."
apt-get update -y

# 步骤 2：安装 Node.js 18
if ! command -v node &> /dev/null; then
    log_info "安装 Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    log_success "Node.js 安装完成: $(node -v)"
else
    log_success "Node.js 已安装: $(node -v)"
fi

# 步骤 3：安装 PM2
if ! command -v pm2 &> /dev/null; then
    log_info "安装 PM2..."
    npm install -g pm2
    log_success "PM2 安装完成"
else
    log_success "PM2 已安装"
fi

# 步骤 4：安装 Nginx
if ! command -v nginx &> /dev/null; then
    log_info "安装 Nginx..."
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    log_success "Nginx 安装完成"
else
    log_success "Nginx 已安装"
fi

# 步骤 5：安装项目依赖
log_info "安装项目依赖..."
npm install

# 步骤 6：创建 .env 文件
if [ ! -f "api/.env" ]; then
    log_info "创建后端环境配置..."
    cat > api/.env << 'EOF'
PORT=3001
# FRONTEND_URL=https://your-app.vercel.app
EOF
    log_success "环境配置文件已创建，请后续编辑 api/.env 文件"
fi

# 步骤 7：启动后端服务
log_info "启动后端服务..."
pm2 delete edu-system-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 配置 PM2 开机自启
pm2 startup -u root --hp /root 2>&1 | tail -1 | bash
pm2 save

# 步骤 8：配置防火墙
log_info "配置防火墙..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22
ufw allow 80
ufw allow 443
echo "y" | ufw enable

# 步骤 9：配置 Nginx
log_info "配置 Nginx..."

cat > /etc/nginx/sites-available/edu-system << 'EOF'
upstream edu_api {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://edu_api/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    access_log /var/log/nginx/edu-system-access.log;
    error_log /var/log/nginx/edu-system-error.log;
}
EOF

# 启用配置
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/edu-system /etc/nginx/sites-enabled/

# 测试并重启 Nginx
if nginx -t; then
    systemctl restart nginx
    log_success "Nginx 配置完成"
else
    log_error "Nginx 配置有问题，请检查"
fi

log_success ""
log_success "=========================================="
log_success "  后端部署完成！"
log_success "=========================================="
log_success ""
log_success "服务状态："
pm2 status
log_success ""
log_success "下一步操作："
log_success "1. 在云服务商安全组中开放 80 端口"
log_success "2. 测试 http://$(hostname -I | awk '{print $1}')/api/health 是否返回 ok"
log_success "3. 部署前端到 Vercel"
log_success "4. 编辑 api/.env 文件，更新 FRONTEND_URL"
log_success "5. 配置域名和 SSL（可选）"
log_success ""
log_success "常用命令："
log_success "  pm2 status              - 查看服务状态"
log_success "  pm2 logs edu-system-api - 查看日志"
log_success "  pm2 restart edu-system-api - 重启服务"
log_success ""
