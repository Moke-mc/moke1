# 教培教务系统 - 完整部署指南

## 目录

1. [部署方案选择](#部署方案选择)
2. [环境准备](#环境准备)
3. [方式一：Docker 部署](#方式一docker-部署)
4. [方式二：手动部署](#方式二手动部署)
5. [前端 Vercel 部署](#前端-vercel-部署)
6. [域名和 SSL 配置](#域名和-ssl-配置)
7. [数据库备份](#数据库备份)
8. [运维管理](#运维管理)

---

## 部署方案选择

### 推荐方案

- **前端**：Vercel（免费 CDN 加速）
- **后端**：云服务器（阿里云/腾讯云 ECS）
- **数据库**：SQLite（本地方便迁移到 MySQL）

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| Docker + 云服务器 | 一键部署，易于管理 | 需要服务器 | ⭐⭐⭐⭐⭐ |
| 手动部署 | 完全控制 | 配置复杂 | ⭐⭐⭐⭐ |
| Vercel + 云函数 | 无服务器 | 需改造代码 | ⭐⭐⭐ |

---

## 环境准备

### 需要的工具

1. **Node.js 18+** - 运行后端服务
2. **Git** - 代码版本控制
3. **Docker** - 容器化部署（可选）
4. **PM2** - Node.js 进程管理

### 云服务器要求

- **最低配置**：1核1G（测试用）
- **推荐配置**：2核2G（生产用）
- **系统**：Ubuntu 20.04 / CentOS 7
- **带宽**：2Mbps 以上

### 域名准备

1. 购买域名（阿里云/腾讯云）
2. 配置 DNS 解析
3. 申请 SSL 证书（Let's Encrypt 免费）

---

## 方式一：Docker 部署（推荐）

### 步骤 1：准备项目

在本地项目根目录执行：

```bash
# 构建 Docker 镜像
docker build -f Dockerfile.backend -t edu-system-api .

# 启动服务
docker run -d \
  --name edu-system-api \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://your-frontend-url.vercel.app \
  edu-system-api
```

### 步骤 2：使用 Docker Compose（更简单）

修改 `docker-compose.yml` 中的配置：

```yaml
services:
  api:
    environment:
      - FRONTEND_URL=https://your-frontend-url.vercel.app
```

启动服务：

```bash
# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 步骤 3：配置 Nginx 反向代理

```bash
# 复制 Nginx 配置
sudo cp nginx/edu-api.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/edu-api /etc/nginx/sites-enabled/

# 测试并重载
sudo nginx -t
sudo systemctl reload nginx
```

---

## 方式二：手动部署

### 步骤 1：构建项目

在本地执行：

```bash
# 安装依赖
npm install

# 构建前端
npm run build

# 创建部署包
chmod +x scripts/build.sh
./scripts/build.sh
```

### 步骤 2：上传到服务器

```bash
# 上传压缩包
scp edu-system-deploy.tar.gz user@your-server:/home/user/

# SSH 登录服务器
ssh user@your-server

# 解压
cd /home/user
tar -xzvf edu-system-deploy.tar.gz
```

### 步骤 3：执行部署脚本

```bash
cd deploy-package

# 赋予执行权限
chmod +x deploy-server.sh

# 运行部署脚本
sudo ./deploy-server.sh
```

脚本会自动：
- 安装 Node.js 18
- 安装 PM2
- 安装 Nginx
- 配置防火墙
- 启动服务

### 步骤 4：配置域名和 SSL

```bash
# 申请 SSL 证书（使用 Certbot）
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 前端 Vercel 部署

### 步骤 1：修改 API 地址

创建 `.env.production` 文件：

```env
VITE_API_URL=https://your-backend-domain.com
```

修改 `vercel.json`：

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-backend-domain.com/api/$1" }
  ]
}
```

### 步骤 2：部署到 Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署（生产环境）
vercel --prod
```

### 步骤 3：配置环境变量

在 Vercel Dashboard 中：
1. 进入项目 Settings
2. 点击 Environment Variables
3. 添加：
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-domain.com`

---

## 域名和 SSL 配置

### Nginx 配置示例

```nginx
upstream edu_api {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # HTTP 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # API 代理
    location /api/ {
        proxy_pass http://edu_api/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 前端静态文件（如果后端也托管前端）
    location / {
        root /var/www/edu-system/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 数据库备份

### 自动备份（推荐）

创建 cron 任务：

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * /path/to/backup-db.sh >> /var/log/backup.log 2>&1
```

### 手动备份

```bash
# 运行备份脚本
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh

# 备份文件位置
ls -lh data/backups/
```

### 数据恢复

```bash
# 停止服务
pm2 stop edu-system-api

# 恢复数据
cp data/backups/database_20240101_120000.sqlite data/database.sqlite

# 重启服务
pm2 restart edu-system-api
```

---

## 运维管理

### 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs edu-system-api

# 重启服务
pm2 restart edu-system-api

# 重载配置
pm2 reload edu-system-api

# 停止服务
pm2 stop edu-system-api

# 开机自启
pm2 startup
pm2 save
```

### 监控

```bash
# 监控面板
pm2 monit

# 查看详细信息
pm2 info edu-system-api
```

### 日志管理

```bash
# 查看访问日志
tail -f /var/log/nginx/edu_api_access.log

# 查看错误日志
tail -f /var/log/nginx/edu_api_error.log

# 日志轮转（自动压缩旧日志）
sudo logrotate -f /etc/logrotate.d/nginx
```

### 性能优化

1. **Node.js 内存限制**

```javascript
// ecosystem.config.js
{
  "max_memory_restart": "500M"
}
```

2. **PM2 集群模式**

```bash
# 启动集群模式
pm2 start ecosystem.config.js --exec_mode cluster

# 设置实例数
pm2 scale edu-system-api 2
```

3. **Nginx 缓存**

```nginx
# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 安全加固

1. **防火墙配置**

```bash
# 只开放必要端口
sudo ufw allow 22   # SSH
sudo ufw allow 80  # HTTP
sudo ufw allow 443 # HTTPS
sudo ufw enable
```

2. **定期更新**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **日志审计**

定期检查：
- `/var/log/auth.log` - SSH 登录日志
- `/var/log/nginx/` - Web 访问日志
- PM2 日志 - 应用运行日志

---

## 故障排查

### 服务无法启动

```bash
# 查看错误日志
pm2 logs edu-system-api --err

# 检查端口占用
sudo lsof -i :3001

# 检查 Node.js 版本
node -v
```

### 数据库连接失败

```bash
# 检查数据库文件权限
ls -lh data/database.sqlite

# 修复权限
chmod 666 data/database.sqlite
chmod 777 data
```

### 前端无法访问后端

1. 检查 CORS 配置
2. 检查 Nginx 代理设置
3. 检查防火墙规则
4. 检查 SSL 证书

### 性能问题

1. **CPU 使用率高**
   - 使用 PM2 集群模式
   - 优化数据库查询

2. **内存不足**
   - 增加 PM2 内存限制
   - 使用 Swap

3. **响应慢**
   - 启用 Nginx 缓存
   - 优化数据库索引

---

## 快速参考

| 操作 | 命令 |
|------|------|
| 启动服务 | `pm2 start ecosystem.config.js` |
| 停止服务 | `pm2 stop edu-system-api` |
| 重启服务 | `pm2 restart edu-system-api` |
| 查看日志 | `pm2 logs edu-system-api` |
| 查看状态 | `pm2 status` |
| Nginx 重载 | `sudo systemctl reload nginx` |
| Nginx 重启 | `sudo systemctl restart nginx` |
| 备份数据库 | `./scripts/backup-db.sh` |
| SSL 续期 | `sudo certbot renew` |

---

## 技术支持

如遇问题，请检查：

1. 服务日志：`pm2 logs edu-system-api`
2. Nginx 日志：`/var/log/nginx/`
3. 系统日志：`/var/log/syslog`
4. 端口占用：`sudo lsof -i :3001`

---

**祝部署顺利！** 🎉
