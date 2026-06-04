# OPC 学员孵化管理系统 V1.0

宸联教育 · OPC（One Person Company）职业培训内部 CRM

| 属性 | 说明 |
|------|------|
| 英文名称 | OPC Student Incubation Management System |
| 包名 / 仓库建议名 | `opc-student-incubation-crm` |
| 技术栈 | Next.js 16 · React 19 · SQLite · Drizzle ORM · shadcn/ui · Tailwind CSS 4 |

面向 OPC 学员全生命周期管理：档案、课程树、期班学籍、班主任跟进、面试/考勤/结业/退费/证书/复训、互动吧导入、BI 看板与审计日志。需求详见 [docs/PRD-OPC学员孵化管理系统-V1.0.md](docs/PRD-OPC学员孵化管理系统-V1.0.md)。

---

## 环境要求

- Node.js 20+
- [pnpm](https://pnpm.io/)（推荐）

---

## 快速开始

```bash
pnpm install
```

若 `better-sqlite3` 未正确编译，可在项目根目录执行：

```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && npm run build-release
```

复制环境变量并按需修改：

```bash
cp .env.example .env.local
```

初始化演示数据库并启动开发服务：

```bash
pnpm db:seed
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)，使用下方测试账号登录。

> **注意**：`pnpm db:seed` 会**清空并重建** `data/opc.db` 中的业务数据，仅适用于本地演示与开发，请勿在生产环境执行。

---

## 测试账号

执行 `pnpm db:seed` 后，可使用以下账号登录（**统一密码：`123456`**）：

| 邮箱 | 显示名 | 角色 | 适用场景 |
|------|--------|------|----------|
| `super@chenlian.com` | 系统超管 | 超级管理员 | 用户管理、班主任管理、审计日志、企微配置、全部数据 |
| `admin@chenlian.com` | 业务管理员 | 业务管理员 | 互动吧导入/合并、课程树、查看全部学员、BI 仪表盘 |
| `zhang@chenlian.com` | 张班主任 | 班主任 | 仅名下学员（张班主任），跟进、学籍、企微 Mock 会话 |
| `li@chenlian.com` | 李班主任 | 班主任 | 仅名下学员（李班主任） |

### 角色权限摘要

| 能力 | 超级管理员 | 业务管理员 | 班主任 |
|------|:----------:|:----------:|:------:|
| 查看全部学员 | ✓ | ✓ | 仅本人名下 |
| 课程树 / 期班管理 | ✓ | ✓ | — |
| 互动吧导入与冲突合并 | ✓ | ✓ | — |
| 班主任批量转移 | ✓ | ✓ | — |
| 用户 / 班主任账号管理 | ✓ | — | — |
| 审计日志 / 企微配置 | ✓ | — | — |

---

## 演示数据说明

种子数据（`src/lib/seed.ts`）预置内容便于联调各业务状态：

| 类型 | 数量 / 说明 |
|------|-------------|
| 学员 | 18 人（手机号 `13800001001`–`13800001018`） |
| 班主任档案 | 3 人（含 1 名已离职「王班主任」） |
| 课程分类 / 系列 | 2 类 / 2 系列（全能方向、技能方向） |
| 期班 | 4 期（招生中、进行中、已归档各含样例） |
| 学籍 | 覆盖进行中、待面试、面试未通过、已结业、校友将到期/已过期、退费等 |
| 跟进 / 面试 / 考勤 / 证书 / 复训 | 多组样例 |
| 企微 Mock | 5 名学员已绑定，含双向聊天记录 |
| 互动吧导入 | 2 个批次；**2 条待处理合并冲突**（`/merge`） |
| 审计日志 | 导入、转移、手机号变更、校友激活等 |

**推荐体验路径**

1. 用 `zhang@chenlian.com` 登录 → 学员列表 → 打开「学员1」查看跟进、学籍、企微侧栏。
2. 用 `admin@chenlian.com` 登录 → 仪表盘 → 互动吧导入 / 导入合并。
3. 用 `super@chenlian.com` 登录 → 用户管理、班主任管理、审计日志。

开发环境也可通过 API 重新灌库（等同 `pnpm db:seed`）：

```bash
curl -X POST http://localhost:3000/api/dev/seed
```

生产环境该接口不可用。

---

## 环境变量

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `SESSION_SECRET` | 建议 | 会话加密密钥，生产环境务必改为随机长字符串 |
| `MOCK_AI` | 否 | `true` 时使用本地 Mock AI 分析（跟进保存后触发） |
| `MOCK_WECOM` | 否 | `true` 时使用 Mock 企微 IM（默认种子已开启 `wecom_mock`） |

示例见 [.env.example](.env.example)。

---

## 功能范围

- 学员 CRM、课程树、学籍、跟进、面试 / 考勤 / 结业 / 退费 / 证书 / 复训
- 互动吧 CSV 导入与冲突合并、班主任批量转移、BI 仪表盘、CSV 导出
- Mock 企微 IM、触发式 Mock AI 分析

---

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器（默认 http://localhost:3000） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 运行生产构建产物 |
| `pnpm lint` | ESLint 检查 |
| `pnpm db:seed` | 初始化 / 重置演示数据库 `data/opc.db` |
| `pnpm db:generate` | Drizzle 生成迁移 SQL |

---

## 项目结构（简要）

```
src/app/          # 页面与 API 路由
src/components/   # UI 与布局组件
src/lib/          # 数据库、鉴权、RBAC、种子数据、Mock 服务
scripts/seed.ts   # 种子 CLI 入口
docs/             # PRD 与需求文档
data/opc.db       # SQLite 数据库（seed 后生成，已 gitignore）
```

---

## 许可证与用途

本项目为宸联教育 OPC 学员孵化管理内部系统 V1.0，用于演示、开发与软著相关材料整理。
