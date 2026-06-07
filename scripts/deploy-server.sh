#!/bin/bash

# ===========================================
# 教培教务系统 - 服务器部署脚本
# ===========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "请使用 root 用户运行此脚本"
        exit 1
    fi
}

# 安装 Node.js 18
install_nodejs() {
    log_info "安装 Node.js 18..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_warning "Node.js 已安装: $NODE_VERSION"
    else
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
        log_success "Node.js 安装完成"
    fi
}

# 安装 PM2
install_pm2() {
    log_info "安装 PM2..."
    
    if command -v pm2 &> /dev/null; then
        log_warning "PM2 已安装"
    else
        npm install -g pm2
        log_success "PM2 安装完成"
    fi
}

# 安装 Nginx
install_nginx() {
    log_info "安装 Nginx..."
    
    if command -v nginx &> /dev/null; then
        log_warning "Nginx 已安装"
    else
        apt-get update
        apt-get install -y nginx
        systemctl enable nginx
        systemctl start nginx
        log_success "Nginx 安装完成"
    fi
}

# 创建目录结构
create_directories() {
    log_info "创建目录结构..."
    
    mkdir -p /var/www/edu-system
    mkdir -p /var/www/edu-system/logs
    mkdir -p /var/www/edu-system/data
    mkdir -p /etc/nginx/ssl
    
    # 设置权限
    chown -R $USER:$USER /var/www/edu-system
    
    log_success "目录创建完成"
}

# 复制项目文件
copy_files() {
    log_info "复制项目文件..."
    
    # 这里需要将本地编译好的文件复制到服务器
    # 请先在本地运行 npm run build
    cp -r ./dist /var/www/edu-system/
    cp -r ./api /var/www/edu-system/
    cp ./ecosystem.config.js /var/www/edu-system/
    
    log_success "文件复制完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    cd /var/www/edu-system/api
    npm install --production
    
    log_success "依赖安装完成"
}

# 配置 Nginx
configure_nginx() {
    log_info "配置 Nginx..."
    
    # 复制 Nginx 配置
    cp ./nginx/edu-api.conf /etc/nginx/sites-available/edu-api
    
    # 创建符号链接
    ln -sf /etc/nginx/sites-available/edu-api /etc/nginx/sites-enabled/
    
    # 测试配置
    nginx -t
    
    # 重载 Nginx
    systemctl reload nginx
    
    log_success "Nginx 配置完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    cd /var/www/edu-system
    
    # 使用 PM2 启动
    pm2 delete edu-system-api 2>/dev/null || true
    pm2 start ecosystem.config.js --env production
    
    # 保存 PM2 配置
    pm2 save
    
    # 设置开机自启
    pm2 startup
    
    log_success "服务启动完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # 安装 ufw
    apt-get install -y ufw
    
    # 配置规则
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    
    # 启用防火墙
    echo "y" | ufw enable
    
    log_success "防火墙配置完成"
}

# 显示服务状态
show_status() {
    log_info "检查服务状态..."
    
    echo ""
    echo "========================================"
    echo "  教培教务系统部署完成"
    echo "========================================"
    echo ""
    echo "后端 API: http://localhost:3001"
    echo "Nginx:   http://localhost:80"
    echo ""
    echo "PM2 状态:"
    pm2 status
    echo ""
    echo "常用命令:"
    echo "  - 查看日志:    pm2 logs edu-system-api"
    echo "  - 重启服务:    pm2 restart edu-system-api"
    echo "  - 查看状态:    pm2 status"
    echo "  - Nginx重载:   systemctl reload nginx"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  教培教务系统 - 服务器部署脚本"
    echo "========================================"
    echo ""
    
    check_root
    install_nodejs
    install_pm2
    install_nginx
    create_directories
    copy_files
    install_dependencies
    configure_nginx
    start_services
    configure_firewall
    show_status
}

# 执行主函数
main "$@"
