# OPC 学员孵化管理系统 V1.0

宸联教育 · 职业教育版 CRM（Next.js 16 + SQLite + shadcn/ui）

## 快速开始

```bash
pnpm install
# 若 better-sqlite3 未编译，在项目根目录执行：
# cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && npm run build-release

pnpm db:seed    # 初始化 data/opc.db 与演示数据
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)，使用演示账号登录：

| 邮箱 | 角色 | 密码 |
|------|------|------|
| super@chenlian.com | 超级管理员 | 123456 |
| admin@chenlian.com | 业务管理员 | 123456 |
| zhang@chenlian.com | 班主任 | 123456 |
| li@chenlian.com | 班主任 | 123456 |

开发环境也可 `POST /api/dev/seed` 重新写入种子数据。

## 功能范围

- 学员 CRM、课程树、学籍、跟进、面试/考勤/结业/退费/证书/复训
- 互动吧 CSV 导入与冲突合并、班主任批量转移、BI 仪表盘、CSV 导出
- Mock 企微 IM、触发式 Mock AI 分析
- 需求详见 [docs/PRD-OPC学员孵化管理系统-V1.0.md](docs/PRD-OPC学员孵化管理系统-V1.0.md)

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm db:seed` | 种子数据 |
| `pnpm db:generate` | Drizzle 生成迁移 SQL |
