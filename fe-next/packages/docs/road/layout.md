技术实施路线图 (Roadmap)
阶段一：空间骨架 (The Spatial Skeleton)

目标： 建立 “书桌 + 书挡” 的三栏物理布局。

核心关注： Flexbox 布局、区域背景色 (bg-sidebar vs bg-desk)、滚动条隔离、Z轴层级。

产出： 一个空的、颜色正确的、左右固定的三列布局。

阶段二：纸张与排版 (The Paper & Typography)

目标： 在中间区域构建 “悬浮纸张” 容器与基础排版。

核心关注： shadow-page 阴影应用、衬线体 (font-serif) 的全局应用、最大宽度约束。

产出： 中间出现一张有物理质感的白纸，上面有排版完美的示例文本。

阶段三：水晶指令栏 (The Crystal Bar)

目标： 实现底部的 “静若处子，动若脱兔” 输入组件。

核心关注： 绝对定位、磨砂玻璃 (backdrop-blur)、Amber/Emerald 的交互态微调。

产出： 能够交互的输入框，具备正确的 hover/focus 颜色变化。

阶段四：侧边栏内容填充 (The Bookends Content)

目标： 填充左右侧边栏的实体内容。

核心关注： UI 字体 (font-sans)、列表项交互、信息卡片 (shadow-card)。

产出： 完整的导航列表和右侧助手卡片流。