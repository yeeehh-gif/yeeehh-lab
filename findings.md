# yeeehh's lab · 发现与知识库

> 最后更新：2026-06-01

---

## 架构决策

### 1. 为什么用 DeepSeek 而非 Gemini
- DeepSeek API key 获取简单（官网注册即得）
- Gemini 需要企业账号或付费方案
- DeepSeek 中文理解能力优秀，适合翻译/词汇评估场景
- API 兼容 OpenAI 格式，`fetch` 直接调用无需 SDK

### 2. 为什么用 Supabase 而非自建数据库
- 免费额度充裕（500MB 数据库）
- 内置 Auth + RLS，零配置认证系统
- PostgreSQL 支持 RPC 函数（如 `update_mastery`）
- `@supabase/ssr` 包完美适配 Next.js App Router 的 cookie 处理

### 3. 为什么训练器用组合模式而非继承
- `Trainer` 接口定义 `generateQuestions(vocab) → TrainingQuestion[]`
- 三种训练器（Reader/Writer/Speaker）各自实现
- 题型通过 `TrainingQuestion.type` 区分，UI 组件按 type 渲染
- `training-session.tsx` 作为编排器，不关心具体训练逻辑

### 4. 移动端 Cookie 延迟问题
- 登录后 `window.location.href` 立刻跳转 → middleware 读到空 cookie → 踢回登录页
- 解决方案：`await new Promise(r => setTimeout(r, 300))` 后再跳转
- 这是 `@supabase/ssr` cookie 写入的已知时序问题

### 5. Next.js Route Groups 陷阱
- `app/(dashboard)/page.tsx` → 路由是 `/`，不是 `/dashboard`
- 括号文件夹只用于布局分组，不产生 URL 段
- 需要 `/dashboard` 必须用 `app/dashboard/page.tsx`

---

## 技术踩坑

### Tailwind v4 配置方式
- v4 使用 CSS-based config（`@theme` 块），不是 `tailwind.config.ts`
- `tailwind.config.ts` 存在会被忽略，反而产生警告
- `--radius-*` 等 CSS 变量需在 `@theme` 内声明，避免冲突

### Supabase SSR Cookie 处理
- 客户端 `createBrowserClient()` 用浏览器原生 cookie
- 服务端 `createServerClient()` 需显式配置 `getAll/setAll`
- 中间件 cookie 读写必须用 response 对象上的方法

### 移动端双重触发
- 不要同时绑 `onClick` 和 `onPointerDown`
- React state 是异步的，两个 handler 同时读到 `loading=false`
- 用 `useRef` 做同步锁 + `<form onSubmit>` 替代

### NotebookLM CLI
- 安装：`pip install "notebooklm-py[browser]"`
- 认证：`notebooklm login` 打开浏览器 OAuth
- 列出笔记本：`notebooklm list --json`
- 获取来源全文：`notebooklm source fulltext <source_id>`

---

## AI 评估策略

### DeepSeek Evaluate 路由 (`/api/training/evaluate`)

| 题型 | 评估策略 | 返回 |
|------|---------|------|
| 写作 | 详细评判：语法、词汇、自然度 | score + feedback + correction + highlights |
| 翻译 | 灵活匹配：接受同义表达、小拼写错误 | score + feedback + accepted |
| 选择 | 简单对错判断 | score |
| 填空 | 大小写宽容 | score + feedback |

**降级策略**：API 异常时默认返回 `score: "correct"`，不阻塞训练流程。

---

## 数据库表结构

| 表 | 用途 | 关键字段 |
|----|------|---------|
| `profiles` | 用户资料 | id, email, daily_goal, streak |
| `vocabulary` | 词汇库 | id, user_id, word, definition, phonetic, example_sentence, mastery, source_notebook, source_note |
| `training_records` | 训练历史 | id, user_id, vocabulary_id, training_type, result, created_at |
| `review_schedule` | 复习调度 | id, vocabulary_id, next_review_at, interval_index, last_review_at |
| `error_backlog` | 错题本 | id, vocabulary_id, error_type, attempts, next_attempt_at |
| `import_sessions` | 导入记录 | id, user_id, source_type, item_count |

---

## 本地开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 内网穿透（校园网）
ssh -R 80:localhost:3000 nokey@localhost.run

# 安装 NotebookLM CLI
pip install "notebooklm-py[browser]"

# NotebookLM 登录
notebooklm login
```
