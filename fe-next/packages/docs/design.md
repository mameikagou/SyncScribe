UI Design System: "Gemini Paper" (双子星纸张风格)

设计哲学：肉身古典（纸张/衬线），灵魂科技（Gemini Blue/光晕）。

1. 核心理念：分层设计 (Dual Layer Philosophy)

UI 由两个截然不同的图层组成，必须泾渭分明：

Layer 1 (静/纸张)：负责所有非 AI 内容（文档、侧边栏、列表）。

关键词：实体、稳重、衬线体、暖白。

参考物：高级财经报纸、铜版纸。

Layer 2 (动/科技)：负责所有 AI 内容（输入框、右侧面板、生成结果）。

关键词：悬浮、磨砂玻璃、Gemini 蓝光晕、无边框。

参考物：钢铁侠的 HUD 界面投射在书桌上。

2. 详细规范 (Specs)

A. 字体策略 (Typography)

在 app/layout.tsx 中配置 CSS 变量

大标题/正文 (The Paper)：必须使用 font-serif (Source Serif 4)。行高宽松
(leading-loose)。

UI 界面 (Sidebar/Nav)：使用 font-sans (Inter)。保持克制，字号偏小 (text-xs 或
text-sm)。

数据/代码 (Data)：必须使用 font-mono (JetBrains Mono)。

B. 色彩语义 (Color Semantics)

背景：全局背景使用 bg-desk (#fcfcfb)，严禁使用纯灰 (Slate-100)。

主文字：使用 text-ink (#1c1917)，严禁使用纯黑。

AI/科技：仅使用 Gemini Blue (text-tech-primary,
shadow-tech-glow)。严禁使用紫色。

金融数据：

增长/正面：text-growth (Emerald-500)。

概念/高亮：text-concept (Amber-500)。

C. 组件样式配方 (Component Recipes)

1. 文档容器 (The Paper Container):

<div className="bg-paper shadow-paper rounded-sm ring-1 ring-black/[0.02]">
  {/* Content */}
</div>

2. AI 悬浮指令栏 (The Gemini Bar): 特点：高模糊、全圆角、蓝色微光晕

<div className="bg-white/80 backdrop-blur-xl rounded-full shadow-tech-glow ring-1 ring-sky-500/10">
  {/* Input */}
</div>

3. AI 右侧面板 (The Glass HUD): 特点：无实体背景，靠模糊和光晕撑起空间

<aside className="border-l border-white/40 backdrop-blur-md bg-white/30 relative">
  <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 to-transparent" />
  {/* Stream */}
</aside>

3. 审美禁忌 (Negative Constraints)

🚫 禁止 给文档区域加粗黑边框。

🚫 禁止 在非 AI 区域使用发光效果。

🚫 禁止 使用大面积的灰色背景块（Sidebar 除外，Sidebar 应极淡）。

🚫 禁止 使用 "圆润可爱" 的圆角，Paper 层应保持 rounded-sm 或 rounded-md
的锐利感。

---
