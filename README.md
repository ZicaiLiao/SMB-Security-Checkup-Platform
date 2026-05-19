# SMB Security Checkup Platform

小微企业网络安全体检平台 MVP，基于 `Next.js App Router + TypeScript + NextAuth + Prisma`。

## Features

- 企业注册、邮箱密码登录、基础多租户隔离
- 六大域网络安全体检问卷
- Google Workspace 样板接入与统一证据模型
- 自动评分、重点发现、整改建议
- 在线仪表盘、站内报告预览、PDF 导出
- 培训活动、钓鱼演练、平台管理员后台

## Tech Stack

- `Next.js 14`
- `TypeScript`
- `NextAuth`
- `Prisma`
- `PostgreSQL` or demo JSON store
- `pdf-lib` + `fontkit` for Chinese PDF export

## Local Development

1. Copy `.env.example` to `.env`
2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
NEXTAUTH_SECRET=replace-with-a-long-random-secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/security_checkup
DEMO_MODE=true
```

## Demo Accounts

- Tenant owner: `owner@acme-ops.test` / `Password123!`
- Platform admin: `security.admin@example.com` / `Admin123!`

## Storage Modes

### Demo mode

- Set `DEMO_MODE=true`
- Data is stored in `.local-data/security-checkup-demo.json`
- Best for local demos and fast MVP verification

### PostgreSQL mode

1. Set `DEMO_MODE=false`
2. Point `DATABASE_URL` to PostgreSQL
3. Run:

```bash
npm run prisma:generate
npm run prisma:push
```

On first boot with an empty database, the app seeds demo data automatically.

## Tests

```bash
npm test
npx tsc --noEmit
npm run build
```

## Vercel Deployment

This project can be deployed on Vercel in demo mode without an external database.

### Minimum production env vars

```env
NEXTAUTH_SECRET=<strong-random-secret>
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
DEMO_MODE=true
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/security_checkup
```

Notes:

- `DATABASE_URL` is still required by the Prisma schema, even when demo mode is enabled.
- Chinese PDF export uses the bundled font file at `public/fonts/NotoSansKaithi-Regular.ttf`, so Vercel does not need a system font.

### Deploy with Vercel CLI

```bash
npx vercel
```

For a production deployment:

```bash
npx vercel --prod
```

## Versioning

- Current release tag: `v0.1.0`
- Release notes are tracked in [CHANGELOG.md](./CHANGELOG.md)
