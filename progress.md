# yeeehh's lab · 进度日志

> 项目：`F:\English Leaning Web`
> 仓库：https://github.com/yeeehh-gif/yeeehh-lab

---

## Session 2026-06-01 · 部署与移动端修复

### 完成内容

1. **移动端登录彻底修复**
   - 根因：`onClick` + `onPointerDown` 双重触发 + React 异步 state
   - 方案：`useRef` 同步锁 + `<form onSubmit>` + `window.location.replace`
   - 附加：`email.trim()`，`autoComplete` 属性，跳转前 300ms 延迟

2. **Vercel 部署**
   - GitHub 仓库创建：`yeeehh-gif/yeeehh-lab`
   - 代码推送（29 commits）
   - Vercel 构建通过（Next.js 16.2.6 + Turbopack）
   - 环境变量加固（`lib/supabase/client.ts` + `server.ts` 添加运行时校验）

3. **内网穿透**
   - cloudflared 国内不可用 → 改用 localhost.run SSH 隧道
   - 用于校园网环境下手机测试

4. **环境变量安全**
   - 确认 `.env*` 在 `.gitignore` 中
   - 代码添加缺失环境变量时的友好报错

5. **规划文件建立**
   - `task_plan.md`：任务状态 + 待处理清单
   - `findings.md`：技术决策 + 踩坑记录
   - `progress.md`：本文件

### 构建日志摘要

```
Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 9.1s
✓ Finished TypeScript in 5.1s
✓ Generating static pages (17/17) in 324ms
Build Completed in 36s
```

### 当前状态

| 项目 | 状态 |
|------|------|
| 本地开发 | ✅ localhost:3000 正常运行 |
| GitHub | ✅ 代码已推送 master 分支 |
| Vercel 构建 | ✅ 通过 |
| Vercel 环境变量 | ✅ 已配置 |
| Vercel 部署 | 🎉 已上线 |
| Vercel URL | https://yeeehh-lab-git-master-yeeehh-s-projects.vercel.app/ |
| 移动端登录 | ✅ 已修复，待 Vercel 验证 |

---

## 历史会话摘要

### Phase 1 · Foundation（2026-05-31）
- Next.js 16 + TypeScript + Tailwind v4 搭建
- Supabase 项目创建 + 数据库迁移
- Supabase Auth 邮箱登录
- shadcn/ui 集成
- 杂志风设计系统

### Phase 2 · Core Training（2026-05-31）
- Ebbinghaus 遗忘曲线引擎
- 阅读训练器 4 种题型
- 训练队列/记录 API
- 错题抓捕

### Phase 3 · Extended Training（2026-05-31）
- 写作/口语训练器
- 统计页可视化
- 每日目标进度

### Phase 4 · Enhancements（2026-05-31）
- PWA 支持
- TTS 发音
- 实时统计连接
- 训练进度持久化

### Post-Phase · AI 评估 + 导入优化（2026-05-31 ~ 06-01）
- DeepSeek AI 答案评估
- NotebookLM 双模式导入
- 侧边栏用户功能
- 移动端登录（多次迭代）
