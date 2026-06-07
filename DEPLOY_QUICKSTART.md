# 🚀 快速部署：Vercel + 云服务器

## 一句话总结

**前端**部署到 Vercel（免费 CDN 加速），**后端**部署到您的云服务器，通过 API 通信。

---

## 📋 前提

- ✅ 有一台云服务器（推荐 Ubuntu 20.04/22.04，2核2G）
- ✅ 有服务器的 root SSH 密码
- ✅ 有 GitHub 账号和 Vercel 账号

---

## 🎯 三个核心步骤

### 第一步：部署后端（约 5-10 分钟）

```bash
# 1. 在您的电脑上，准备后端文件
cd /workspace
mkdir -p deploy-backend
cp -r api package.json ecosystem.config.js scripts/backup-db.sh scripts/deploy-backend.sh deploy-backend/
chmod +x deploy-backend/scripts/deploy-backend.sh

# 2. 上传到服务器（替换为您的服务器 IP）
scp -r deploy-backend root@your-server-ip:/root/

# 3. SSH 连到服务器
ssh root@your-server-ip

# 4. 在服务器上运行部署脚本
cd /root/deploy-backend
chmod +x scripts/deploy-backend.sh
./scripts/deploy-backend.sh
```

**完成后记得**：
- 在云服务商控制台安全组中，开放 **80 端口**（HTTP）
- 测试：`http://your-server-ip/api/health` 应该返回 `{"success":true,"message":"ok"}`

---

### 第二步：部署前端到 Vercel（约 2-5 分钟）

#### 1. 推送到 GitHub

```bash
cd /workspace
git init
git add .
git commit -m "First commit"
git remote add origin https://github.com/your-username/your-repo.git  # 替换为您的仓库
git push -u origin main
```

#### 2. 在 Vercel 导入项目

1. 访问 https://vercel.com/new
2. 用 GitHub 登录，选择刚才的仓库
3. **Project Settings** 中配置：
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables** 中添加：
   ```
   Name: VITE_API_URL
   Value: http://your-server-ip  # 替换为您的服务器 IP
   ```
5. 点击 **Deploy**，等待 1-2 分钟

部署完成后，您会获得一个地址，例如：`https://your-app.vercel.app`

---

### 第三步：关联前端和后端（最后一步）

#### 1. 更新后端的 CORS 配置

```bash
# SSH 连到服务器
ssh root@your-server-ip
cd /root/deploy-backend

# 编辑 .env 文件
nano api/.env
```

将里面的内容改为：
```env
PORT=3001
FRONTEND_URL=https://your-app.vercel.app  # 替换为 Vercel 分配给您的地址
```

重启后端：
```bash
pm2 restart edu-system-api
```

---

## ✅ 完成！测试一下

1. 打开浏览器访问 Vercel 分配的地址
2. 用测试账号登录：
   - 管理员：admin / admin123
   - 教师：teacher1 / teacher123
   - 家长：parent1 / parent123

**重要**：首次登录成功后，**立即修改默认密码**！

---

## 📚 更多配置

### 配置域名和 SSL（可选但推荐）

1. 购买一个域名（在阿里云/腾讯云/Cloudflare 等）
2. 在域名管理中：
   - 将 `yourdomain.com` 或 `app.yourdomain.com` → 绑定到 Vercel（在 Vercel 设置中配置）
   - 将 `api.yourdomain.com` → A 记录，解析到您的服务器 IP
3. 在服务器上申请 SSL：
   ```bash
   apt-get install -y certbot python3-certbot-nginx
   certbot --nginx -d api.yourdomain.com
   ```
4. 在 Vercel 中更新环境变量：
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```

### 设置自动备份

```bash
# SSH 连到服务器
crontab -e
# 添加一行（每天凌晨2点备份）
0 2 * * * cd /root/deploy-backend && ./scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 🔧 常用命令

| 操作 | 命令 |
|------|------|
| 查看后端服务状态 | `pm2 status` |
| 查看后端日志 | `pm2 logs edu-system-api` |
| 重启后端服务 | `pm2 restart edu-system-api` |
| 重启 Nginx | `systemctl restart nginx` |
| 更新代码后重新部署 | `git push`（Vercel 会自动重新构建） |

---

## ❓ 常见问题

### Q: 浏览器打不开我的应用？
A: 检查几点：
1. 云服务器安全组是否开放了 **80 端口**
2. 服务器防火墙 `ufw status` 是否放行了
3. 后端服务是否运行 `pm2 status`

### Q: 前端能打开，但登录失败？
A: 检查：
1. Vercel 的 `VITE_API_URL` 环境变量是否正确
2. 后端的 `api/.env` 中 `FRONTEND_URL` 是否是您的 Vercel 地址
3. `pm2 restart edu-system-api` 重启后端

---

需要更详细的帮助？查看 [VERCEL_DEPLOY_GUIDE.md](./VERCEL_DEPLOY_GUIDE.md)
