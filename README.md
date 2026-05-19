# SMB Security Checkup Platform

小微企业网络安全体检平台 MVP，基于 `Next.js App Router + TypeScript + NextAuth + Prisma schema`。

## 当前实现

- 企业注册、邮箱密码登录、基础多租户隔离
- 六大域问卷体检
- Google Workspace 样板接入与统一证据模型
- 自动评分、重点发现、整改建议
- 在线仪表盘与 PDF 报告导出
- 培训活动、钓鱼演练展示
- 平台管理员后台

## 本地运行

1. 复制 `.env.example` 为 `.env`
2. 安装依赖：`npm install`
3. 启动开发环境：`npm run dev`
4. 访问 [http://localhost:3000](http://localhost:3000)

## 切换到 PostgreSQL / Prisma

1. 在 `.env` 中把 `DEMO_MODE` 改成 `false`
2. 把 `DATABASE_URL` 指向你的 PostgreSQL 实例
3. 运行 `npm run prisma:generate`
4. 运行 `npm run prisma:push`
5. 重新启动 `npm run dev`

首次连库时，如果数据库里还是空的，系统会自动把 demo 数据引导进 PostgreSQL，方便你继续演示和开发。

## 演示账号

- 企业租户：`owner@acme-ops.test` / `Password123!`
- 平台管理员：`security.admin@example.com` / `Admin123!`

## 存储说明

仓库已包含 `prisma/schema.prisma` 作为正式 PostgreSQL 数据模型骨架。
为了让 MVP 在当前环境里可立即运行，业务数据先使用 `.local-data/security-checkup-demo.json` 作为演示存储。

## 当前环境备注

当前工作区路径包含空格，`npm install` 在解压 `next` 的 SWC 原生包时出现过异常。
本次开发已通过 `/private/tmp/security-checkup-install/node_modules` 建立符号链接来完成依赖安装与构建验证。
