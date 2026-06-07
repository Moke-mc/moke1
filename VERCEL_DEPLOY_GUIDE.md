# Vercel + 云服务器 部署完整指南

## 🎯 部署架构

- **前端**: Vercel (免费，全球 CDN 加速)
- **后端**: 云服务器 (阿里云/腾讯云/华为云等)
- **数据库**: SQLite (存储在服务器上，方便迁移)

---

## 📋 准备工作

### 1. 必备项
- ✅ 一台云服务器（推荐：2核2G，Ubuntu 20.04/22.04）
- ✅ 服务器 SSH 访问权限（root 用户）
- ✅ GitHub/GitLab 账号（用于 Vercel 自动部署）
- ✅ Vercel 账号（免费注册：https://vercel.com/）

### 2. 可选但推荐
- 🔑 一个域名（用于绑定后端服务）
- 🔒 SSL 证书（Let's Encrypt 免费）

---

## 🔧 第一阶段：本地配置和准备

### 步骤 1：配置环境变量

在项目根目录创建 `.env.production` 文件：

```bash
cd /workspace
cp .env.production.example .env.production
```

编辑 `.env.production`：

```env
# Vercel 部署后会自动替换为您的实际后端地址
# 先临时设置一个占位值，部署后回来修改
VITE_API_URL=http://your-backend-domain.com
```

### 步骤 2：推送到 GitHub

将项目推送到 GitHub 仓库：

```bash
# 初始化 git（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库（替换为您的仓库）
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

---

## ☁️ 第二阶段：部署后端到云服务器

### 步骤 1：准备后端部署包

在本地执行：

```bash
cd /workspace

# 复制后端代码到一个文件夹
mkdir -p deploy-backend
cp -r api deploy-backend/
cp package.json deploy-backend/
cp ecosystem.config.js deploy-backend/
cp scripts/backup-db.sh deploy-backend/

# 只保留后端需要的依赖
# 修改 package.json 的 scripts 部分
```

### 步骤 2：上传到服务器

```bash
# 上传文件（替换为您的服务器 IP）
scp -r deploy-backend root@your-server-ip:/root/

# SSH 连接到服务器
ssh root@your-server-ip
```

### 步骤 3：在服务器上部署后端

```bash
cd /root/deploy-backend

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 PM2
npm install -g pm2

# 安装项目依赖
npm install

# 创建后端的 .env 文件
cat > api/.env << 'EOF'
PORT=3001
# 等 Vercel 部署后，更新这里的 FRONTEND_URL
FRONTEND_URL=https://your-vercel-domain.vercel.app
EOF

# 启动后端服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 配置防火墙
ufw allow 22
ufw allow 80
ufw allow 443
echo "y" | ufw enable

# 配置 Nginx（如果需要）
apt-get install -y nginx
```

### 步骤 4：配置 Nginx 反向代理

创建 `/etc/nginx/sites-available/edu-api` 文件：

```nginx
upstream edu_api {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name your-backend-domain.com;

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

    access_log /var/log/nginx/edu-api-access.log;
    error_log /var/log/nginx/edu-api-error.log;
}

server {
    listen 80;
    server_name _;
    location / {
        root /var/www/edu-system/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

启用配置：

```bash
# 启用站点
ln -sf /etc/nginx/sites-available/edu-api /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

---

## 🌐 第三阶段：部署前端到 Vercel

### 步骤 1：导入项目到 Vercel

1. 访问 https://vercel.com/new
2. 用 GitHub 账号登录
3. 选择您刚才推送的项目仓库
4. 点击 "Import"

### 步骤 2：配置 Vercel

在项目设置页面：

1. **Framework Preset**: 选择 "Vite"
2. **Root Directory**: 保持为空（直接使用根目录）
3. **Build Command**: 自动检测（`npm run build`）
4. **Output Directory**: 自动检测（`dist`）

### 步骤 3：配置环境变量

在 Vercel 的项目设置 → Environment Variables：

添加：

```
Name: VITE_API_URL
Value: http://your-server-ip  # 临时先用 IP，有域名后更新
Environment: Production, Preview, Development
```

### 步骤 4：部署

点击 "Deploy" 按钮，等待部署完成！

部署完成后，您会获得一个类似 `https://your-app.vercel.app` 的访问地址。

---

## 🔄 第四阶段：完成配置

### 步骤 1：更新后端 CORS 配置

在服务器上，更新后端的 `.env` 文件：

```bash
ssh root@your-server-ip

cd /root/deploy-backend/api

# 编辑 .env 文件
nano .env

# 更新 FRONTEND_URL 为 Vercel 分配的地址
FRONTEND_URL=https://your-app.vercel.app
```

重启后端服务：

```bash
pm2 restart edu-system-api
```

### 步骤 2：更新 Vercel 环境变量

在 Vercel 项目设置中，更新 `VITE_API_URL` 为您的服务器地址：

```
Name: VITE_API_URL
Value: http://your-server-ip  # 或者您的域名（如果配置了）
```

然后重新部署（或者推送到 GitHub 会自动触发部署）。

---

## 🛡️ 第五阶段：优化和安全（可选但推荐）

### 1. 配置 SSL 和域名（推荐）

在云服务商控制台配置域名解析：

- 将 `api.your-domain.com` 解析到您的服务器 IP
- 将 `app.your-domain.com` 配置为 Vercel 的自定义域名

在服务器上申请 SSL 证书：

```bash
# 安装 Certbot
apt-get install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d api.your-domain.com
```

### 2. 更新配置为 HTTPS

更新 Vercel 的环境变量：

```
VITE_API_URL=https://api.your-domain.com
```

更新服务器后端的 `.env`：

```
FRONTEND_URL=https://app.your-domain.com
```

### 3. 设置数据库自动备份

```bash
# 在服务器上
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * cd /root/deploy-backend && ./backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 📱 测试和验证

### 1. 访问您的应用

打开浏览器，访问您的 Vercel 地址：
```
https://your-app.vercel.app
```

### 2. 测试登录

使用测试账号：
- 管理员：admin / admin123
- 教师：teacher1 / teacher123
- 家长：parent1 / parent123

### 3. 重要！修改默认密码

部署成功后，**立即**修改默认密码！

---

## 🔧 常用命令

### 服务器端
```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs edu-system-api

# 重启服务
pm2 restart edu-system-api

# 停止服务
pm2 stop edu-system-api
```

### Vercel
```bash
# 安装 Vercel CLI（可选）
npm install -g vercel

# 部署
vercel --prod
```

---

## ❓ 常见问题

### 1. 前端无法访问后端 API
- 检查服务器安全组是否开放了 80 端口
- 检查服务器防火墙（`ufw status`）
- 检查后端服务是否运行（`pm2 status`）
- 查看 Nginx 错误日志：`tail -f /var/log/nginx/edu-api-error.log`

### 2. CORS 错误
- 确认后端的 `FRONTEND_URL` 配置正确
- 确认 Vercel 的 `VITE_API_URL` 配置正确
- 重启后端服务

### 3. Vercel 部署失败
- 检查构建日志
- 确认仓库代码是最新的
- 检查环境变量配置

---

## 🎉 完成！

部署完成后，您就可以和团队、客户一起使用这个教务系统了！

**记得修改默认密码和设置自动备份！**
