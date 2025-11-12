. 核心理念 采用 Single Viewport (单视口) 设计，类似于 Google AI Studio 或移动端 App。应用只有一个核心舞台，通过顶部切换器在“Chat（对话）”和“Doc（文档）”模式间切换。

2. 路由与状态

URL 驱动： 尽管是单视口，但 URL 应反映状态（/chat vs /doc），以便分享和刷新。

状态管理 (Jotai): 使用 viewModeAtom ('chat' | 'doc') 控制视图的显隐（使用 CSS opacity/z-index 切换，而非卸载组件，以保持 WebSocket 连接和滚动位置）。

3. 布局结构 (Flexbox)

Root: h-screen flex flex-col overflow-hidden (全屏，无 body 滚动)。

Header: 固定高度，包含 Logo 和 ToggleGroup 模式切换器。

Main Stage: flex-1 relative。

ChatView: 绝对定位，全屏，内部滚动。

DocView: 绝对定位，全屏，内部滚动。

Bottom Bar: 固定在底部，包含 ChatInput 组件。

4. 移动端适配

桌面端：Header 显示完整菜单。

移动端：Header 变为汉堡菜单，点击滑出 Sheet (侧边栏)。内容区自动 100% 宽度。