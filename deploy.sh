#!/bin/bash
# 教务系统 - 一键部署脚本
# 在云服务器上执行：bash deploy.sh

set -e

echo "=========================================="
echo "   教务系统 一键部署"
echo "=========================================="
echo ""

# 1. 安装 Node.js 18
if ! command -v node &> /dev/null; then
  echo "[1/6] 安装 Node.js 18 ..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
else
  echo "[1/6] Node.js 已安装: $(node -v)"
fi

# 2. 安装 PM2
if ! command -v pm2 &> /dev/null; then
  echo "[2/6] 安装 PM2 进程管理器 ..."
  npm install -g pm2
else
  echo "[2/6] PM2 已安装"
fi

# 3. 安装项目依赖
echo "[3/6] 安装项目依赖 ..."
npm install

# 4. 构建前端
echo "[4/6] 构建前端 ..."
npm run build

# 5. 启动服务
echo "[5/6] 启动服务 ..."
pm2 delete edu-system 2>/dev/null || true
pm2 start "npx tsx api/server.ts" --name edu-system
pm2 save

# 6. 设置开机自启
echo "[6/6] 设置开机自启 ..."
pm2 startup 2>/dev/null || true

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "你的服务器IP")

echo ""
echo "=========================================="
echo "   部署成功！"
echo "=========================================="
echo ""
echo "  访问地址: http://${SERVER_IP}:3001"
echo ""
echo "  管理命令:"
echo "    pm2 status            查看状态"
echo "    pm2 logs edu-system   查看日志"
echo "    pm2 restart edu-system 重启服务"
echo "    pm2 stop edu-system   停止服务"
echo ""
echo "  默认账号:"
echo "    管理员: admin / admin123"
echo "    教师:   teacher1 / teacher123"
echo "    家长:   parent1 / parent123"
echo "=========================================="
