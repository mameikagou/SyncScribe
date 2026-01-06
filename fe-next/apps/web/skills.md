---
name: vibe-sandbox
description: 仅用于快速 UI/Vibe 试验的隔离区。使用 /vibe 下的路由、API、Storybook stories，不污染主业务和核心架构。
---

# 目标 (Vision)
- 在不破坏核心架构的前提下，获取“即时视觉反馈”的试验场。
- 只处理外观和交互，不承诺业务正确性；需要上线再重构回正式区。

# 目录规约 (The Vibe Sandbox)
- Storybook 试验：`fe-next/apps/web/stories/vibe`
- API 试验：`fe-next/apps/web/app/api/vibe`
- 页面/组件试验：`fe-next/apps/web/app/vibe`
- 入口路由试验：`fe-next/apps/web/app/vibe`（需要路由预览时放这里）

# 工作流 (How to use)
1) 在 `/vibe` 下开分支目录，不复用主线组件/状态，必要时复制粘贴。
2) 视觉优先：跟随 `fe-next/design.md` 的配色/动效，Tailwind 渐变和动画随意用。
3) Mock 数据：在 `.stories.tsx` 里硬编码，禁止连后端；需要 Provider 时在 story decorators 里临时包。
4) Lint/规范可放松：允许 `any`、允许大文件，但不要把试验代码引入正式路径。
5) 收尾迁移：真要上线时，把可复用的部分抽到正式目录并补全类型/测试，再清理 `/vibe`。

# Storybook 指南 (Vibe Storybook)
- 目标：最快能点开、能看效果，配置越少越好。
- SideBar 可见：story 里简单导出组件即可，不要写复杂 meta。
- 依赖 Provider：只在当前 story 的 `decorators` 包，不改全局配置。
- 数据：直接在 story 里构造 mock，必要时写本地 helper，但不请求接口。
