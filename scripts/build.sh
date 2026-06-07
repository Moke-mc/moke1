#!/bin/bash

# ===========================================
# 教培教务系统 - 本地构建和打包脚本
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

# 清理函数
clean() {
    log_info "清理旧文件..."
    rm -rf dist
    rm -rf node_modules/.vite
    rm -rf .next
    log_success "清理完成"
}

# 安装依赖
install_deps() {
    log_info "安装依赖..."
    npm install
    log_success "依赖安装完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    npm run build
    log_success "前端构建完成"
}

# 创建部署包
create_package() {
    log_info "创建部署包..."
    
    # 创建部署目录
    mkdir -p deploy-package
    rm -rf deploy-package/*
    
    # 复制前端构建文件
    cp -r dist ./deploy-package/
    
    # 复制后端代码
    cp -r api ./deploy-package/
    
    # 复制配置文件
    cp package.json ./deploy-package/
    cp ecosystem.config.js ./deploy-package/
    cp .env.example ./deploy-package/api/
    
    # 复制部署脚本
    cp scripts/deploy-server.sh ./deploy-package/
    cp nginx/edu-api.conf ./deploy-package/
    cp Dockerfile.backend ./deploy-package/
    cp docker-compose.yml ./deploy-package/
    
    # 创建 README
    cat > ./deploy-package/README.md << 'EOF'
# 教培教务系统部署包

## 快速开始

### 方式一：使用 Docker 部署（推荐）

1. 上传所有文件到服务器
2. 修改 docker-compose.yml 中的域名配置
3. 运行：
   ```bash
   docker-compose up -d
   ```

### 方式二：手动部署

1. 上传所有文件到服务器 `/var/www/edu-system/`
2. 运行部署脚本：
   ```bash
   chmod +x deploy-server.sh
   ./deploy-server.sh
   ```

## 配置说明

### 环境变量

复制 `api/.env.example` 为 `api/.env` 并配置：

```env
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

### Nginx 配置

修改 `edu-api.conf` 中的：
- `your-backend-domain.com` 为您的域名
- SSL 证书路径

### PM2 配置

修改 `ecosystem.config.js` 中的环境变量。

## 常用命令

```bash
# 查看日志
pm2 logs edu-system-api

# 重启服务
pm2 restart edu-system-api

# 查看状态
pm2 status

# 停止服务
pm2 stop edu-system-api

# 删除服务
pm2 delete edu-system-api
```

## 数据备份

数据库文件位于：`data/database.sqlite`

定期备份命令：
```bash
cp data/database.sqlite data/backup/database_$(date +%Y%m%d).sqlite
```
EOF

    log_success "部署包创建完成: deploy-package/"
}

# 压缩部署包
compress_package() {
    log_info "压缩部署包..."
    
    tar -czvf edu-system-deploy.tar.gz deploy-package/
    
    log_success "压缩完成: edu-system-deploy.tar.gz"
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  教培教务系统 - 构建和打包"
    echo "========================================"
    echo ""
    
    clean
    install_deps
    build_frontend
    create_package
    compress_package
    
    echo ""
    echo "========================================"
    echo "  构建完成！"
    echo "========================================"
    echo ""
    echo "部署包位置: deploy-package/"
    echo "压缩文件:   edu-system-deploy.tar.gz"
    echo ""
    echo "下一步："
    echo "1. 上传压缩包到服务器"
    echo "2. 解压并运行部署脚本"
    echo ""
}

main "$@"
