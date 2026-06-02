# yeeehh's lab · 任务规划

> 最后更新：2026-06-01
> 项目路径：`F:\English Leaning Web`
> GitHub：https://github.com/yeeehh-gif/yeeehh-lab
> Vercel：构建通过，待确认环境变量后重新部署

---

## 项目目标

一款对接 NotebookLM 的个人英语学习工具。从笔记中提取词汇，按艾宾浩斯遗忘曲线安排复习，区分阅读/口语/写作三种训练模式。

## 技术栈

| 层面 | 选型 | 备注 |
|------|------|------|
| 框架 | Next.js 16.2.6 (App Router + Turbopack) | 实际使用 16，非设计文档的 14 |
| 语言 | TypeScript | strict mode |
| 样式 | Tailwind CSS v4 (CSS-based config) | @theme 内联，非 tailwind.config.ts |
| 组件 | shadcn/ui | button, input, label, card, dialog, separator |
| 数据库 | Supabase (PostgreSQL) | RLS 启用 |
| 认证 | Supabase Auth (邮箱/密码) | middleware.ts 做路由保护 |
| AI 提取 | DeepSeek API + NotebookLM CLI | 替代原 Gemini 方案 |
| AI 评估 | DeepSeek API | 翻译/写作/填空的灵活批改 |
| 部署 | Vercel (免费版) | 需配置环境变量 |
| 字体 | Fraunces + DM Sans + DM Mono | Google Fonts，杂志编辑风格 |

---

## 模块完成状态

### 核心模块

| # | 模块 | 状态 | 备注 |
|---|------|------|------|
| M1 | 笔记导入与 AI 提取 | ✅ 完成 | 四步流程：选模式 → AI提取 → 审核 → 完成 |
| M2 | 词汇与内容管理 | ⚠️ 基础完成 | CRUD 功能已有，搜索/筛选待增强 |
| M3 | 艾宾浩斯调度引擎 | ✅ 完成 | 1/2/4/7/15/30 天间隔 |
| M4 | 训练执行模块 | ✅ 完成 | 阅读/写作/口语 + AI 评估 |
| M5 | 进度追踪与统计 | ✅ 完成 | 热力图、掌握率、日历 |
| M6 | 错题强化闭环 | ✅ 完成 | 短间隔重排 → 连续正确释放 |

### 辅助模块

| # | 模块 | 状态 | 备注 |
|---|------|------|------|
| A1 | 目标设定与提醒 | ❌ 未开始 | 每日目标 + 浏览器通知 |
| A2 | TTS 语音增强 | ✅ 完成 | Web Speech API，闪卡集成 |
| A3 | PWA 离线支持 | ✅ 完成 | manifest + service worker |

---

## 已完成的阶段

### Phase 1 · Foundation ✅
- Next.js 16 + TypeScript + Tailwind v4 项目搭建
- Supabase 数据库模型（6 张表 + RLS）
- Supabase Auth 邮箱登录 + middleware 路由保护
- shadcn/ui 组件集成
- 杂志编辑风格设计系统（Fraunces + DM Sans，暖白纸色）
- 基础 UI 布局（Sidebar + AppLayout）

### Phase 2 · Core Training ✅
- Ebbinghaus 遗忘曲线引擎（`lib/ebbinghaus.ts`）
- 训练队列 API（`/api/training/queue`）
- 训练记录 API（`/api/training/record`）
- 错题抓捕（`lib/training/error-backlog.ts`）
- 阅读训练器（闪卡 + 翻译 + 填空 + 理解，4 种题型）
- 训练 UI 组件（flashcard, translation, cloze, comprehension）
- 训练会话编排器（`training-session.tsx`）

### Phase 3 · Extended Training ✅
- 写作训练器（`trainer-writer.ts`）
- 口语训练器（`trainer-speaker.ts`）
- 统计页（热力图 + 掌握度柱状图 + 复习日历）
- 每日目标进度组件
- Supabase RPC `update_mastery` 函数

### Phase 4 · Enhancements ✅
- PWA 支持（manifest + 图标）
- TTS 发音按钮（Web Speech API）
- 主页统计实时数据连接
- 训练进度 localStorage 持久化

### Post-Phase · 优化与部署（当前会话）✅
- 移动端登录修复（双重触发 + cookie 延迟）
- DeepSeek AI 答案评估（`/api/training/evaluate`）
- NotebookLM 导入双模式（Paste text / NotebookLM sources）
- 侧边栏用户信息 + 退出登录
- Vercel 部署（代码推送 + 构建通过）
- 环境变量校验（`lib/supabase/client.ts` + `server.ts`）

---

## 待处理任务

### 🔴 P0 · 安全和部署

- [ ] **DeepSeek API Key 轮换** — 密钥已提交 git 历史，需在 DeepSeek 后台生成新 key
- [ ] **Vercel 环境变量配置** — 确认 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`DEEPSEEK_API_KEY` 三个变量已设
- [x] **Vercel 部署验证** — 上线地址：https://yeeehh-lab-git-master-yeeehh-s-projects.vercel.app/

### 🟡 P1 · 设计一致性

- [ ] **训练页杂志风格重设计** — 当前 training 组件仍有旧漫画风格残留，需统一为杂志编辑风
- [ ] **统计页视觉优化** — 增加视觉重点，减少平铺感
- [ ] **主页 hero 区域** — 文案左对齐而非居中

### 🟢 P2 · 功能增强

- [ ] **词汇库搜索与筛选** — 关键词搜索、按时间/掌握度筛选
- [ ] **目标设定系统（A1）** — 每日目标 + streak 追踪 + 浏览器通知
- [ ] **邮箱验证流程** — Supabase Auth 的 email verification
- [ ] **移动端 PWA 离线训练** — service worker 缓存训练数据

### 🔵 P3 · 技术债务

- [ ] **middleware.ts → proxy.ts** — Next.js 16 推荐迁移
- [ ] **添加 CI lint/typecheck** — GitHub Actions 自动检查
- [ ] **单元测试** — 至少覆盖 ebbinghaus 引擎和训练器
- [ ] **DeepSeek key 清理** — `git filter-branch` 或 `bfg` 清除历史中的密钥

---

## 错误记录

| 日期 | 错误 | 根因 | 解决方案 |
|------|------|------|----------|
| 06-01 | mobile login stuck | onClick + onPointerDown 双重触发；cookie 写入延迟导致中间件踢回 | useRef 同步锁 + `<form onSubmit>` + 跳转前 await 300ms |
| 06-01 | Vercel `Invalid value` on fetch | 环境变量未配置，process.env 为 undefined | 代码加固（运行时检查）+ 用户配置 Vercel env vars |
| 06-01 | cloudflared 国内不可用 | trycloudflare.com 被墙 | 改用 localhost.run SSH 隧道 |
| 06-01 | `gh` CLI 找不到 | winget 安装后未刷新 PATH | 使用完整路径 `/c/Program Files/GitHub CLI/gh` |
| 05-31 | 404 on /dashboard | route group `(dashboard)` 不添加 URL 段 | 改用普通文件夹 `app/dashboard/` |
| 05-31 | 移动端登录不跳转 | Next.js router.push 在移动端不可靠 | 改用 `window.location.replace` |
| 05-31 | 训练自动跳题/显示答案 | 缺少防重入守卫 + React 组件复用 | submitting 状态锁 + `key={question.id}` |
| 05-31 | NotebookLM CLI CSRF 错误 | Google 页面结构变更 | `notebooklm login` 重新认证 |
