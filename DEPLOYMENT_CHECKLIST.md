# 部署清单 - 教培教务系统

## ✅ 准备工作

### 1. 购买云服务器（阿里云/腾讯云）
- [ ] 推荐配置：2核2G
- [ ] 系统：Ubuntu 20.04
- [ ] 购买域名并配置 DNS

### 2. 本地准备
- [ ] 安装 Node.js 18+
- [ ] 安装 Git
- [ ] 安装 Docker Desktop（可选）

## 📦 部署步骤

### 阶段一：本地构建

```bash
# 1. 进入项目目录
cd /workspace

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 创建部署包
chmod +x scripts/build.sh
./scripts/build.sh
```

### 阶段二：后端部署到云服务器

```bash
# 1. 上传到服务器（需要替换为您的服务器地址）
scp -r deploy-package user@your-server-ip:/home/user/

# 2. SSH 登录服务器
ssh user@your-server-ip

# 3. 进入部署目录
cd deploy-package

# 4. 运行部署脚本
chmod +x deploy-server.sh
sudo ./deploy-server.sh
```

### 阶段三：前端部署到 Vercel

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 修改 API 地址（在 vercel.json 中修改）
# 将 "your-backend-domain.com" 替换为您的实际后端域名

# 4. 部署
vercel --prod
```

### 阶段四：配置域名和 SSL

```bash
# 在服务器上执行
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔧 配置清单

### 需要修改的配置项

#### 1. vercel.json
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-actual-backend-domain.com/api/$1" }
  ]
}
```

#### 2. .env.production
```
VITE_API_URL=https://your-actual-backend-domain.com
```

#### 3. docker-compose.yml
```yaml
environment:
  - FRONTEND_URL=https://your-actual-frontend-url.vercel.app
```

#### 4. nginx/edu-api.conf
```nginx
server_name your-actual-domain.com;  # 替换为您的域名
ssl_certificate /path/to/your-cert.pem;
ssl_certificate_key /path/to/your-key.pem;
```

#### 5. api/.env
```
FRONTEND_URL=https://your-actual-frontend-url.vercel.app
```

## 📝 部署检查点

### 后端检查
- [ ] 服务器可以访问：`curl http://localhost:3001/api/auth/dashboard`
- [ ] 防火墙开放端口：80, 443
- [ ] Nginx 正常运行：`sudo systemctl status nginx`
- [ ] PM2 服务运行：`pm2 status`

### 前端检查
- [ ] Vercel 部署成功，获得 URL
- [ ] API 请求正常
- [ ] 登录功能正常

### 完整流程测试
- [ ] 管理员登录 → 添加教师/学员/课程
- [ ] 教师登录 → 查看课表 → 核销课时
- [ ] 家长登录 → 查看子女信息

## 🛠️ 常用运维命令

### 服务器端

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs edu-system-api

# 重启服务
pm2 restart edu-system-api

# Nginx 重载
sudo systemctl reload nginx

# SSL 证书续期
sudo certbot renew
```

### 数据库备份

```bash
# 手动备份
./backup-db.sh

# 查看备份
ls -lh data/backups/
```

## 📊 部署完成后的 URLs

| 服务 | URL |
|------|-----|
| 前端地址 | ________________ |
| 后端地址 | ________________ |
| 管理后台 | ________________ |

## 🔐 测试账号

| 角色 | 用户名 | 密码 | URL |
|------|--------|------|-----|
| 管理员 | admin | admin123 | [URL]/admin/dashboard |
| 教师 | teacher1 | teacher123 | [URL]/teacher/schedule |
| 家长 | parent1 | parent123 | [URL]/parent/profile |

## 📞 故障排查

### 问题 1：前端无法访问后端
**检查项**：
- [ ] CORS 配置是否正确
- [ ] Nginx 代理是否配置
- [ ] 防火墙是否开放端口

**解决命令**：
```bash
# 检查 Nginx 日志
tail -f /var/log/nginx/error.log

# 测试 API 访问
curl -I http://localhost:3001/api/auth/dashboard
```

### 问题 2：数据库连接失败
**解决命令**：
```bash
# 检查文件权限
ls -lh data/database.sqlite

# 修复权限
chmod 666 data/database.sqlite
chmod 777 data
```

### 问题 3：服务无法启动
**解决命令**：
```bash
# 查看详细错误
pm2 logs edu-system-api --err

# 检查端口占用
sudo lsof -i :3001

# 重新安装依赖
cd /var/www/edu-system/api
npm install
pm2 restart edu-system-api
```

## 📋 后续维护清单

### 每日
- [ ] 检查 PM2 状态
- [ ] 查看错误日志

### 每周
- [ ] 检查数据库备份
- [ ] 检查 SSL 证书有效期

### 每月
- [ ] 系统更新
- [ ] 性能优化
- [ ] 安全检查

### 每季度
- [ ] 完整数据备份
- [ ] 灾备演练
- [ ] 容量评估

---

## ✅ 部署完成确认

在完成所有步骤后，请在下方签字确认：

**部署完成日期**：________________

**部署人员**：________________

**系统访问地址**：________________

**遇到的问题及解决**：________________

---

**恭喜！您的教培教务系统已成功部署上线！** 🎉
