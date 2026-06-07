# 方案二：手动部署 - 完整步骤指南

## 📋 目录
- [前提准备](#前提准备)
- [第一阶段：本地准备](#第一阶段本地准备)
- [第二阶段：云服务器准备](#第二阶段云服务器准备)
- [第三阶段：上传文件到服务器](#第三阶段上传文件到服务器)
- [第四阶段：服务器端部署](#第四阶段服务器端部署)
- [第五阶段：测试和验证](#第五阶段测试和验证)
- [常见问题排查](#常见问题排查)

---

## 前提准备

在开始部署之前，请确保您已经：

- ✅ 有一台云服务器（阿里云/腾讯云/华为云等）
  - 推荐配置：2核2G，带宽2Mbps以上
  - 操作系统：Ubuntu 20.04 LTS 或 22.04 LTS
- ✅ 有一个域名（可选但推荐）
- ✅ 有服务器的 SSH 访问权限（用户名和密码或 SSH 密钥）
- ✅ 本地电脑已安装 Node.js 18+

---

## 第一阶段：本地准备

### 步骤 1.1：安装依赖和构建项目

在本地电脑上，进入项目目录并执行：

```bash
cd /workspace

# 1. 安装依赖
npm install

# 2. 构建前端项目
npm run build
```

如果构建成功，您会看到 `dist` 文件夹生成。

### 步骤 1.2：创建部署包

```bash
# 确保部署脚本有执行权限
chmod +x scripts/build.sh
chmod +x scripts/deploy-step-by-step.sh

# 构建部署包
./scripts/build.sh
```

执行后会生成：
- `deploy-package/` 文件夹
- `edu-system-deploy.tar.gz` 压缩文件

### 步骤 1.3：检查部署包内容

```bash
ls -la deploy-package/
```

应该包含：
- `dist/` - 前端构建文件
- `api/` - 后端代码
- `package.json`
- `ecosystem.config.js`
- `deploy-step-by-step.sh`
- 以及其他配置文件

---

## 第二阶段：云服务器准备

### 步骤 2.1：连接到服务器

使用 SSH 连接到您的服务器（替换为您的实际信息）：

```bash
# 方法一：使用密码
ssh root@您的服务器IP

# 方法二：使用 SSH 密钥（更安全）
ssh -i /path/to/your/key.pem root@您的服务器IP
```

首次连接时会提示：
```
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```
输入 `yes` 然后回车。

### 步骤 2.2：更新系统（可选但推荐）

在服务器上执行：

```bash
# 更新包列表
apt update -y

# 升级已安装的包（可选，可能需要一些时间）
apt upgrade -y
```

### 步骤 2.3：检查必要端口

```bash
# 检查 80 端口是否被占用
netstat -tuln | grep :80

# 检查 3001 端口是否被占用
netstat -tuln | grep :3001
```

如果端口被占用，需要先停止占用的服务。

---

## 第三阶段：上传文件到服务器

### 方式一：使用 SCP 上传（推荐）

在**本地电脑**的新终端窗口中（不要在 SSH 连接里）执行：

```bash
# 进入项目目录
cd /workspace

# 上传部署包到服务器
scp -r deploy-package root@您的服务器IP:/root/
```

或者如果您想上传压缩文件：

```bash
# 上传压缩包
scp edu-system-deploy.tar.gz root@您的服务器IP:/root/
```

上传进度会显示，等待上传完成。

### 方式二：使用 SFTP 客户端

如果您有图形化的 SFTP 客户端（如 FileZilla、WinSCP）：
1. 连接到您的服务器
2. 将 `deploy-package` 文件夹上传到 `/root/` 目录

---

## 第四阶段：服务器端部署

### 步骤 4.1：在服务器上解压文件

回到**服务器 SSH 连接**，执行：

```bash
# 进入部署目录
cd /root/

# 查看文件（确认上传成功）
ls -la

# 如果上传的是压缩包，先解压
# tar -xzvf edu-system-deploy.tar.gz
# cd deploy-package

# 进入部署包目录
cd deploy-package/

# 查看内容
ls -la
```

### 步骤 4.2：赋予部署脚本执行权限

```bash
chmod +x deploy-step-by-step.sh
```

### 步骤 4.3：执行部署脚本

```bash
# 运行完整部署脚本
./deploy-step-by-step.sh
```

这个脚本会自动完成以下操作：
1. ✅ 更新系统
2. ✅ 安装 Node.js 18
3. ✅ 安装 PM2
4. ✅ 安装 Nginx
5. ✅ 创建项目目录
6. ✅ 复制项目文件
7. ✅ 安装项目依赖
8. ✅ 配置 Nginx
9. ✅ 启动后端服务
10. ✅ 配置防火墙
11. ✅ 设置开机自启

### 步骤 4.4：等待部署完成

脚本运行过程中，请观察输出，确认所有步骤都成功完成。

最后会看到类似这样的总结：
```
========================================
  教培教务系统部署完成
========================================

访问地址: http://123.45.67.89
后端 API: http://localhost:3001
```

---

## 第五阶段：测试和验证

### 步骤 5.1：检查服务状态

```bash
# 检查 PM2 服务状态
pm2 status

# 检查 Nginx 状态
systemctl status nginx

# 检查后端是否监听 3001 端口
netstat -tuln | grep :3001
```

所有服务都应该显示 `active (running)`。

### 步骤 5.2：查看服务日志（如有问题）

```bash
# 查看 PM2 日志
pm2 logs edu-system-api

# 或者只看最近 100 行
pm2 logs edu-system-api --lines 100

# 查看 Nginx 访问日志
tail -f /var/log/nginx/edu-system-access.log

# 查看 Nginx 错误日志
tail -f /var/log/nginx/edu-system-error.log
```

### 步骤 5.3：本地测试访问

在您的电脑浏览器中，访问：
```
http://您的服务器IP
```

应该能看到登录界面。

### 步骤 5.4：使用测试账号登录

使用以下账号测试：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 教师 | teacher1 | teacher123 |
| 家长 | parent1 | parent123 |

测试功能：
- ✅ 登录成功
- ✅ 可以查看仪表板
- ✅ 可以添加学生/教师/课程
- ✅ 可以查看课表

---

## 常见问题排查

### 问题 1：浏览器无法访问服务器

**检查清单：**
1. 服务器安全组是否开放了 80 端口？
   - 在云服务商控制台检查安全组规则
2. 服务器防火墙是否开放了 80 端口？
   ```bash
   ufw status
   ```
3. Nginx 是否正在运行？
   ```bash
   systemctl status nginx
   ```
4. 服务器 IP 是否正确？
   ```bash
   hostname -I
   ```

### 问题 2：前端可以访问但 API 请求失败

**检查清单：**
1. 后端服务是否运行？
   ```bash
   pm2 status
   ```
2. Nginx 配置是否正确？
   ```bash
   nginx -t
   ```
3. 查看 Nginx 错误日志：
   ```bash
   tail -f /var/log/nginx/edu-system-error.log
   ```

### 问题 3：PM2 服务启动失败

**检查清单：**
1. 查看 PM2 错误日志：
   ```bash
   pm2 logs edu-system-api --err
   ```
2. 检查 Node.js 版本：
   ```bash
   node -v
   ```
3. 检查依赖是否安装：
   ```bash
   cd /var/www/edu-system
   ls -la node_modules/
   ```
4. 手动启动后端测试：
   ```bash
   cd /var/www/edu-system/api
   npx tsx server.ts
   ```

### 问题 4：数据库错误

**检查清单：**
1. 检查数据库文件权限：
   ```bash
   ls -lh /var/www/edu-system/api/data/database.sqlite
   ```
2. 修复权限：
   ```bash
   chmod 666 /var/www/edu-system/api/data/database.sqlite
   chown -R www-data:www-data /var/www/edu-system/
   ```

---

## 🎯 部署成功后的下一步

### 1. 配置域名（可选但推荐）

在您的域名服务商控制台：
1. 添加 A 记录
   - 主机记录：`@` 或 `www`
   - 记录值：您的服务器 IP

### 2. 申请 SSL 证书（启用 HTTPS）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 申请证书（替换为您的域名）
certbot --nginx -d your-domain.com
```

按照提示操作，Certbot 会自动配置 Nginx。

### 3. 设置定时数据库备份

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * cd /var/www/edu-system && ./scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

### 4. 修改默认密码

**重要！** 部署成功后，务必：
1. 使用 admin 登录
2. 修改 admin 密码
3. 为教师和家长创建真实账号
4. 删除或禁用测试账号

---

## 📝 常用运维命令

### PM2 相关
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs edu-system-api

# 重启服务
pm2 restart edu-system-api

# 停止服务
pm2 stop edu-system-api

# 启动服务
pm2 start edu-system-api

# 查看详细信息
pm2 info edu-system-api
```

### Nginx 相关
```bash
# 查看状态
systemctl status nginx

# 重载配置
systemctl reload nginx

# 重启
systemctl restart nginx

# 测试配置
nginx -t
```

### 系统相关
```bash
# 查看磁盘空间
df -h

# 查看内存使用
free -h

# 查看进程
top
```

---

## ✅ 部署完成检查清单

- [ ] 可以在浏览器访问服务器 IP
- [ ] 可以登录管理后台
- [ ] 可以添加学生/教师
- [ ] 可以查看课表
- [ ] 数据库文件正常
- [ ] 防火墙配置正确
- [ ] PM2 服务正常
- [ ] Nginx 服务正常
- [ ] 设置了数据库自动备份

---

**恭喜！您已成功完成部署！** 🎉

如有问题，请参考 [DEPLOYMENT.md](file:///workspace/DEPLOYMENT.md) 查看更详细的说明。
