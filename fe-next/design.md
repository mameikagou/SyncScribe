UI Design System: "The Mature Intellect" (成熟智库风格)

设计哲学： 抛弃科幻与霓虹，回归物理与经典。这不仅仅是一个 App，它是实木书桌上的一份高级研究报告。 核心隐喻：Desk (书桌) + Paper (纸张) + Bookends (书挡)。

1. 空间架构 (Spatial Metaphor)

对称书挡 (The Bookends):

左侧栏 (Library) 和右侧栏 (Assistant) 必须使用相同的背景色 (bg-sidebar)。

它们就像书桌两侧的实体挡板，稳稳地夹住中间的纸张，提供对称的安全感。

严禁右侧栏悬浮或透明，必须是实体的。

纸张居中 (The Paper):

中间区域是神圣的阅读空间，必须使用纯白背景 (bg-paper) 和深邃的投影 (shadow-page)，营造出“纸张浮于桌面”的物理质感。

2. 色彩语义 (Color Palette)

基调：Stone (岩石灰)

bg-desk (#f0f0ef): 暖灰，稍微深一点，为了衬托纸张的白。

text-ink (#1c1917): 深岩灰，严禁使用纯黑 (#000000)。

行动：Emerald (祖母绿)

代表：执行、增长、完成、数据。

场景：选中状态、增长数据、主按钮 Hover 态。

类名：text-action, bg-action。

思考：Amber (琥珀金)

代表：洞察、高亮、AI 的思考过程、Warning。

场景：高亮文本块 (bg-amber-50)、关键提示图标。

类名：text-thought。

3. 关键组件规范 (Component Recipes)

A. 水晶指令栏 (The Crystal Bar) 位于屏幕底部中央，既要通透又要稳重。

TypeScript

<div className="bg-white/80 backdrop-blur-xl rounded-full shadow-crystal ring-1 ring-stone-900/5 flex items-center">
  {/* Static Icon: Amber Sparkle */}
  {/* Input Field */}
  {/* Action Button: 默认 Stone-900 (黑), Hover 变 Emerald-600 (绿) */}
</div>
B. 侧边栏卡片 (Sidebar Cards) 实体卡片，而非悬浮玻璃。

TypeScript

<div className="bg-white border border-stone-200 shadow-card rounded-lg p-4 hover:border-action/50 transition-colors">
  {/* Content */}
</div>
C. 字体排印 (Typography)

标题/正文: font-serif (Source Serif 4)。赋予文档权威感。

UI/界面: font-sans (Inter)。保持克制与清晰。

数据/图表: font-mono (JetBrains Mono)。专业且精确。


3. 审美禁忌 (Negative Constraints)

🚫 禁止 给文档区域加粗黑边框。

🚫 禁止 在非 AI 区域使用发光效果。

🚫 禁止 使用大面积的灰色背景块（Sidebar 除外，Sidebar 应极淡）。

🚫 禁止 使用 "圆润可爱" 的圆角，Paper 层应保持 rounded-sm 或 rounded-md
的锐利感。

