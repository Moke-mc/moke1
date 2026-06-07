# 🚀 方案二手动部署 - 快速开始卡片

## 📋 部署前准备

### 必需项
- ✅ 一台云服务器（Ubuntu 20.04/22.04，推荐 2核2G）
- ✅ 服务器 SSH 访问权限（root 用户）
- ✅ 本地电脑已安装 Node.js 18+

---

## 🎯 三步完成部署

### 第一步：本地构建（本地电脑执行）

```bash
cd /workspace

# 1. 安装依赖
npm install

# 2. 构建前端
npm run build

# 3. 制作部署包
chmod +x scripts/build.sh
./scripts/build.sh
```

执行成功后，会生成 `deploy-package` 文件夹。

---

### 第二步：上传到服务器（本地电脑执行）

```bash
# 在 /workspace 目录下执行
scp -r deploy-package root@您的服务器IP:/root/
```

**提示**：替换 `您的服务器IP` 为实际 IP，输入服务器密码。

---

### 第三步：服务器部署（SSH 连接到服务器执行）

```bash
# 1. 连接到服务器
ssh root@您的服务器IP

# 2. 进入部署目录
cd /root/deploy-package

# 3. 赋予执行权限
chmod +x deploy-step-by-step.sh

# 4. 运行部署脚本（一键完成）
./deploy-step-by-step.sh
```

等待脚本执行完成，约 3-10 分钟。

---

## ✅ 部署完成后

### 访问地址

```
http://您的服务器IP
```

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 教师 | teacher1 | teacher123 |
| 家长 | parent1 | parent123 |

### 重要！部署后必须做的事

1. **修改默认密码** - 立即修改 admin 密码
2. **删除测试账号** - 删除或禁用测试账号
3. **设置定时备份** - 配置自动数据库备份

---

## 🛠️ 常见问题

### 问题 1：浏览器打不开？
**检查：**
1. 服务器安全组是否开放了 80 端口？
2. 服务器防火墙是否开放 80 端口？
3. Nginx 是否正在运行？

```bash
# SSH 到服务器检查
systemctl status nginx
ufw status
```

### 问题 2：登录后白屏？
**检查：**
1. 后端服务是否运行？
```bash
pm2 status
```
2. 查看错误日志
```bash
pm2 logs edu-system-api
```

### 问题 3：API 报错？
**检查：**
1. Nginx 配置是否正确？
```bash
nginx -t
```
2. 查看 Nginx 错误日志
```bash
tail -f /var/log/nginx/edu-system-error.log
```

---

## 📝 相关文档

| 文档 | 说明 |
|------|------|
| [MANUAL_DEPLOYMENT_GUIDE.md](file:///workspace/MANUAL_DEPLOYMENT_GUIDE.md) | 详细分步部署指南 |
| [CONFIGURATION.md](file:///workspace/CONFIGURATION.md) | 配置文件说明 |
| [TEST_CHECKLIST.md](file:///workspace/TEST_CHECKLIST.md) | 测试验证清单 |
| [DEPLOYMENT.md](file:///workspace/DEPLOYMENT.md) | 完整部署文档 |

---

## 💡 下一步

部署成功后，您可以：

1. **配置域名** - 将域名指向服务器 IP
2. **启用 HTTPS** - 使用 Certbot 申请免费 SSL 证书
3. **配置备份** - 设置定时数据库备份
4. **性能优化** - 按需调整 PM2 和 Nginx 配置

详见 [CONFIGURATION.md](file:///workspace/CONFIGURATION.md)

---

**祝您部署顺利！** 🎉

如有问题，请参考详细文档或查看日志。
