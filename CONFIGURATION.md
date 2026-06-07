# 部署配置说明

## 📋 本文件提供部署过程中需要修改的配置项汇总

---

## 1. Nginx 配置

### 1.1 服务器名配置

**文件位置**：`/etc/nginx/sites-available/edu-system

部署脚本会自动创建此文件。如需修改：

```bash
# 编辑配置
sudo nano /etc/nginx/sites-available/edu-system
```

**需要修改的内容：

```nginx
server {
    listen 80;
    server_name 您的域名.com www.您的域名.com;  # ← 修改这里
    ...
}
```

### 1.2 SSL 证书配置

配置 SSL 后，配置文件会变成：

```nginx
server {
    listen 443 ssl http2;
    server_name 您的域名.com;
    
    ssl_certificate /etc/letsencrypt/live/您的域名.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/您的域名.com/privkey.pem;
    ...
}

# HTTP 自动跳转 HTTPS
server {
    listen 80;
    server_name 您的域名.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 2. PM2 配置

**文件位置**：`/var/www/edu-system/ecosystem.config.js`

默认配置：

```javascript
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
      PORT: 3001,
      FRONTEND_URL: 'https://您的域名.com'  # ← 修改这里
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

修改配置后需要重启 PM2：

```bash
cd /var/www/edu-system
pm2 restart edu-system-api
```

---

## 3. 环境变量配置

### 3.1 后端环境变量

**文件位置**：`/var/www/edu-system/api/.env`

如果需要先复制示例文件：

```bash
cd /var/www/edu-system/api
cp .env.example .env
nano .env
```

配置项说明：

```env
# 服务器端口
PORT=3001

# 前端访问的域名（用于 CORS）
FRONTEND_URL=https://您的域名.com

# 数据库路径
DB_PATH=./data/database.sqlite

# Session 密钥（生产环境请修改）
SESSION_SECRET=your-secret-key-change-in-production

# API 密钥（可选）
API_KEY=your-api-key
```

---

## 4. 防火墙配置

### 4.1 开放端口

当前开放的端口：
- 22 - SSH
- 80 - HTTP
- 443 - HTTPS

查看当前规则：

```bash
sudo ufw status
```

如需修改：

```bash
# 允许端口
sudo ufw allow 8080

# 禁止端口
sudo ufw deny 8080

# 重新加载
sudo ufw reload
```

---

## 5. 备份配置

### 5.1 定时备份配置

编辑 crontab：

```bash
crontab -e
```

添加：

```bash
# 每天 02:00 备份数据库
0 2 * * * cd /var/www/edu-system && ./scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

### 5.2 备份保留策略

备份脚本会自动保留最近 30 天的备份。

---

## 6. SSL 证书配置（HTTPS）

### 6.1 使用 Certbot 申请免费证书

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d 您的域名.com -d www.您的域名.com
```

按照提示操作，Certbot 会自动：
1. 验证域名
2. 获取证书
3. 配置 Nginx
4. 设置自动续期

### 6.2 检查证书有效期

```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew --dry-run
```

---

## 7. 修改默认密码

### 7.1 管理员密码

**非常重要！部署成功后，务必修改默认密码

```bash
# 登录系统
# 在浏览器访问
# 进入设置 → 用户管理
# 修改密码
```

---

## 8. 性能调优

### 8.1 PM2 集群模式

如果服务器性能足够，可以开启集群模式：

```javascript
// ecosystem.config.js
{
  instances: 2,  // 根据 CPU 核数设置
  exec_mode: 'cluster'
}
```

重启：

```bash
pm2 restart edu-system-api
```

### 8.2 Nginx 缓存

编辑 `/etc/nginx/nginx.conf

```nginx
events {
    worker_connections 2048;  # 增加连接数
}
```

---

## 9. 安全建议

- [ ] 修改默认 SSH 端口
- [ ] 禁用 root 登录（使用 sudo 用户）
- [ ] 使用 SSH 密钥登录
- [ ] 定期更新系统
- [ ] 设置 fail2ban
- [ ] 定期备份
- [ ] 监控访问日志

---

## 10. 配置快速参考

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 后端端口 | 3001 | 后端 API 服务端口 |
| Nginx 端口 | 80, 443 | Web 服务端口 |
| 项目路径 | /var/www/edu-system | 项目部署路径 |
| 数据库路径 | /var/www/edu-system/api/data | 数据库文件位置 |
| 日志路径 | /var/www/edu-system/logs | 应用日志 |
| Nginx 日志 | /var/log/nginx/ | Nginx 日志 |
