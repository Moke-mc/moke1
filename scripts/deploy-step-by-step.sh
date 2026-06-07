#!/bin/bash

# ===========================================
# 教培教务系统 - 分步部署脚本
# ===========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  步骤 $1: $2${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "请使用 root 用户运行此脚本，或使用 sudo"
        exit 1
    fi
}

# 步骤 1: 更新系统
step1_update_system() {
    log_step "1" "更新系统"
    log_info "正在更新系统包..."
    
    apt-get update -y
    
    log_success "系统更新完成"
}

# 步骤 2: 安装 Node.js 18
step2_install_nodejs() {
    log_step "2" "安装 Node.js 18"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_warning "Node.js 已安装: $NODE_VERSION"
    else
        log_info "正在下载 Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        log_info "正在安装 Node.js..."
        apt-get install -y nodejs
        log_success "Node.js 安装完成: $(node -v)"
    fi
    
    # 检查 npm
    npm -v
}

# 步骤 3: 安装 PM2
step3_install_pm2() {
    log_step "3" "安装 PM2"
    
    if command -v pm2 &> /dev/null; then
        log_warning "PM2 已安装: $(pm2 -v)"
    else
        log_info "正在安装 PM2..."
        npm install -g pm2
        log_success "PM2 安装完成"
    fi
}

# 步骤 4: 安装 Nginx
step4_install_nginx() {
    log_step "4" "安装 Nginx"
    
    if command -v nginx &> /dev/null; then
        log_warning "Nginx 已安装: $(nginx -v)"
    else
        log_info "正在安装 Nginx..."
        apt-get install -y nginx
        systemctl enable nginx
        systemctl start nginx
        log_success "Nginx 安装完成"
    fi
}

# 步骤 5: 安装其他工具
step5_install_tools() {
    log_step "5" "安装其他工具"
    
    apt-get install -y git curl wget ufw
    log_success "工具安装完成"
}

# 步骤 6: 创建项目目录
step6_create_directories() {
    log_step "6" "创建项目目录"
    
    mkdir -p /var/www/edu-system
    mkdir -p /var/www/edu-system/logs
    mkdir -p /var/www/edu-system/data
    mkdir -p /etc/nginx/ssl
    
    chown -R www-data:www-data /var/www/edu-system
    
    log_success "目录创建完成"
}

# 步骤 7: 复制项目文件
step7_copy_files() {
    log_step "7" "复制项目文件"
    
    if [ -d "./api" ] && [ -d "./dist" ]; then
        log_info "正在复制项目文件..."
        
        cp -r ./dist /var/www/edu-system/
        cp -r ./api /var/www/edu-system/
        
        if [ -f "./ecosystem.config.js" ]; then
            cp ./ecosystem.config.js /var/www/edu-system/
        fi
        
        if [ -f "./package.json" ]; then
            cp ./package.json /var/www/edu-system/
        fi
        
        # 确保数据库目录存在
        mkdir -p /var/www/edu-system/api/data
        
        chown -R www-data:www-data /var/www/edu-system
        chmod -R 755 /var/www/edu-system
        
        log_success "文件复制完成"
    else
        log_error "当前目录缺少必需文件 (api/ 或 dist/)"
        log_info "请确保在项目根目录运行此脚本"
        exit 1
    fi
}

# 步骤 8: 安装项目依赖
step8_install_deps() {
    log_step "8" "安装项目依赖"
    
    cd /var/www/edu-system
    
    if [ -f "package.json" ]; then
        npm install --production
        log_success "依赖安装完成"
    else
        log_warning "package.json 不存在，跳过安装依赖"
    fi
}

# 步骤 9: 配置 Nginx
step9_configure_nginx() {
    log_step "9" "配置 Nginx"
    
    # 创建 Nginx 配置
    cat > /etc/nginx/sites-available/edu-system << 'EOF'
upstream edu_api {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /var/www/edu-system/dist;
        try_files $uri $uri/ /index.html;
        
        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # API 反向代理
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
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 访问日志
    access_log /var/log/nginx/edu-system-access.log;
    error_log /var/log/nginx/edu-system-error.log;
}
EOF
    
    # 启用站点
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/edu-system /etc/nginx/sites-enabled/
    
    # 测试 Nginx 配置
    if nginx -t; then
        log_success "Nginx 配置完成"
    else
        log_error "Nginx 配置有错误"
        exit 1
    fi
}

# 步骤 10: 启动后端服务
step10_start_api() {
    log_step "10" "启动后端服务"
    
    cd /var/www/edu-system
    
    # 删除旧的 PM2 进程
    pm2 delete edu-system-api 2>/dev/null || true
    
    # 创建临时 ecosystem 配置（如果不存在）
    if [ ! -f "ecosystem.config.js" ]; then
        cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'edu-system-api',
    script: 'api/server.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    watch: false,
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF
    fi
    
    # 启动服务
    pm2 start ecosystem.config.js
    
    # 保存 PM2 配置
    pm2 save
    
    log_success "后端服务启动完成"
}

# 步骤 11: 设置防火墙
step11_configure_firewall() {
    log_step "11" "配置防火墙"
    
    # 配置规则
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # 启用防火墙（非交互式）
    echo "y" | ufw enable
    
    log_success "防火墙配置完成"
}

# 步骤 12: 配置 PM2 开机自启
step12_enable_autostart() {
    log_step "12" "配置 PM2 开机自启"
    
    pm2 startup
    
    log_success "开机自启配置完成"
}

# 显示服务状态
show_status() {
    log_step "总结" "部署完成！"
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  教培教务系统部署完成${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${CYAN}访问地址:${NC} http://$(hostname -I | awk '{print $1}')"
    echo -e "${CYAN}后端 API:${NC} http://localhost:3001"
    echo ""
    echo -e "${YELLOW}常用命令:${NC}"
    echo "  - 查看服务状态: pm2 status"
    echo "  - 查看服务日志: pm2 logs edu-system-api"
    echo "  - 重启服务:     pm2 restart edu-system-api"
    echo "  - 停止服务:     pm2 stop edu-system-api"
    echo "  - 重载 Nginx:   systemctl reload nginx"
    echo ""
    echo -e "${YELLOW}下一步:${NC}"
    echo "  1. 在浏览器访问上面的地址测试"
    echo "  2. 配置域名 DNS 解析"
    echo "  3. 申请 SSL 证书（参考 DEPLOYMENT.md）"
    echo "  4. 设置定时备份"
    echo ""
    
    # 显示 PM2 状态
    log_info "PM2 服务状态:"
    pm2 status
    
    # 显示 Nginx 状态
    log_info "Nginx 服务状态:"
    systemctl status nginx --no-pager -l
}

# 主函数
main() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  教培教务系统 - 分步部署脚本${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    check_root
    
    # 执行所有步骤
    step1_update_system
    step2_install_nodejs
    step3_install_pm2
    step4_install_nginx
    step5_install_tools
    step6_create_directories
    step7_copy_files
    step8_install_deps
    step9_configure_nginx
    step10_start_api
    step11_configure_firewall
    step12_enable_autostart
    
    # 重载 Nginx
    log_info "重载 Nginx..."
    systemctl reload nginx
    
    show_status
}

# 如果直接运行，执行主函数
if [ "$0" = "$BASH_SOURCE" ]; then
    main
fi
