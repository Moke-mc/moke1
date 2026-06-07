# 教培机构三端一体化课时管理系统

## 项目简介

一个完整的教培机构教务管理系统，支持管理员、教师、家长三种角色，实现日常教务数字化管理。

## 功能特性

### 管理员端
- 📊 仪表板：数据概览和统计
- 👥 师资管理：添加、编辑、删除教师
- 🧑‍🎓 学员管理：添加、编辑、删除学员
- 📚 课程管理：课程管理
- 📅 排班管理：安排课程（固定时间段）
- 📈 课程表：可视化日历视图
- 📝 课时记录：查看所有课时记录
- 💬 历史评语：查看课堂评语

### 教师端
- 📅 排班列表：查看个人排课
- 📊 我的课表：可视化日历视图
- 👥 授课学员：查看所教学员
- ✅ 课时核销：核销课时并写评语

### 家长端
- 👤 子女档案：查看子女信息
- 📅 上课安排：查看排课
- ⏱️ 剩余课时：查看课时情况
- 💬 历史评语：查看课堂评语

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Express + TypeScript
- **数据库**: SQLite
- **状态管理**: Zustand
- **路由**: React Router DOM
- **图标**: Lucide React

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173/

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 教师 | teacher1 | teacher123 |
| 家长 | parent1 | parent123 |

## 生产环境构建

```bash
# 本地构建
npm run build

# 使用部署脚本
chmod +x scripts/build.sh
./scripts/build.sh
```

## 部署指南

### 方式一：Docker 部署（推荐）

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 方式二：手动部署

1. 使用 `scripts/build.sh` 构建项目
2. 上传 `deploy-package` 到服务器
3. 运行 `deploy-server.sh`

详细部署文档请查看 [部署文档](./DEPLOYMENT.md)

## 项目结构

```
├── api/                    # 后端代码
│   ├── routes/           # API 路由
│   ├── db.ts            # 数据库配置
│   └── server.ts        # 服务器入口
├── src/                   # 前端代码
│   ├── components/      # 通用组件
│   ├── pages/          # 页面组件
│   │   ├── admin/      # 管理员页面
│   │   ├── teacher/    # 教师页面
│   │   └── parent/     # 家长页面
│   ├── store.ts        # 状态管理
│   └── App.tsx         # 应用入口
├── scripts/              # 部署脚本
├── nginx/               # Nginx 配置
└── docker-compose.yml   # Docker 配置
```

## API 接口

- `POST /api/auth/login` - 用户登录
- `GET /api/auth/dashboard` - 获取仪表板数据
- `GET/POST/PUT/DELETE /api/teachers` - 教师管理
- `GET/POST/PUT/DELETE /api/students` - 学员管理
- `GET/POST/PUT/DELETE /api/courses` - 课程管理
- `GET/POST/PUT/DELETE /api/schedules` - 排班管理
- `GET/POST /api/lessons` - 课时管理

## 数据库

SQLite 数据库文件：`database.sqlite`

### 数据表

- `users` - 用户表
- `teachers` - 教师表
- `parents` - 家长表
- `students` - 学员表
- `courses` - 课程表
- `schedules` - 排班表
- `lesson_records` - 课时记录表

## 备份

```bash
# 运行备份脚本
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

备份文件保存在 `data/backups/` 目录

## License

MIT
