# 响应式三栏布局设计 v2.0 (The "Command-Center" Layout)

> 核心理念： 输入与输出分离 (Decoupled Input/Output)。
> 交互模式： 用户在中间的“主舞台”通过底部浮动指令栏下达命令，AI 的思考过程和复杂结果流式传输到右侧“副屏”，保持写作心流不被打断。

## 1\. 布局架构 (Layout Architecture)

采用 React Resizable Panels 架构。

### 桌面端/宽屏布局 (Desktop)

```text
+------------------+----------------------------------------+----------------------+
|  Left Sidebar    |             Main Editor (Center)       |    Right Panel       |
|                  |                                        |                      |
| [ 📂 File Tree ] |  [ Title: Q3 Financial Report      ]   |  [ AI Response Area] |
| [ 🔖 Bookmarks ] |                                        |                      |
|                  |  ( The Document Content...       )     |  ( Streamed Text )   |
|                  |  ( User is typing here...        )     |  ( Charts/Cards  )   |
|                  |                                        |                      |
|                  |                                        |                      |
| [ Settings ]     |    [ ✨ Floating Command Bar ]         |                      |
+------------------+----------------------------------------+----------------------+
     (20%)                        (50% - Focus)                    (30% - Aux)
```

#### 1\. Left Sidebar (资源导航区)

   定位：安静的资源库。
   内容：
       文档树 (File Tree)。
       历史会话归档 (History)。
   交互：点击文件，仅在中间区域打开/切换。

#### 2\. Center Stage (核心创作区 + 指挥中心)

   定位：用户的视觉焦点，输入发生的地方。
   核心组件：
       Tiptap Editor：文档本身。
       Floating Command Input (底部浮动输入框)：
           位置：悬浮在编辑器底部中央（类似 macOS Dock 或 Spotlight）。
           功能：这是与 AI 交互的唯一入口。用户在这里输入“分析这段财报”或“生成图表”。
           状态：平时半透明/收起，激活时展开。

#### 3\. Right Panel (AI 响应/副屏区)

   定位：AI 的输出展示区。
   内容：
       Stream Flow：当用户在中间输入指令后，AI 的回复（文字、分析结果）会流式渲染在这里。
       Artifacts：生成的图表、卡片、代码片段会在这里展示，用户可以将其拖拽回中间文档。
   差异化设计：
       没有输入框：右侧栏底部不放输入框（或者只放一个极小的追问框），强制用户习惯使用中间的全局指令栏，避免视线频繁右移。

-----

## 2\. 关键交互流程 (The Flow)

### A. “隔空投送”式交互 (The Cast Interaction)

这是本设计的灵魂：

1.  输入 (Input)：用户目光聚焦在中间文档，呼出底部浮动条输入：“帮我总结右边这几篇研报的观点”。
2.  响应 (Output)：指令发送后，浮动条有一个“发射”的动画，AI 的回答在 右侧面板 开始流式生成。
3.  优势：用户不需要把鼠标移到最右边去点输入框，手始终在键盘热区，但眼睛可以用余光看到右边的生成结果。

### B. 移动端/窄屏适配 (Mobile)

由于手机屏幕无法容纳三栏：

1.  Left Sidebar -\> 汉堡菜单 (Hamburger Menu)。
2.  Right Panel -\> 底部抽屉 (Bottom Drawer)。
       当 AI 开始回答时，从底部弹出一个半屏高度的面板展示结果。
3.  Floating Input -\> 依然吸附在屏幕底部，键盘弹起时自动上移 (Keyboard Avoidance)。

-----

## 3\. 组件结构示例 (React + Shadcn)

```tsx
// apps/web/layout/MainLayout.tsx

<PanelGroup direction="horizontal" className="h-screen w-full">
  
  {/ --- 1. 左侧导航 --- /}
  <Panel defaultSize={20} minSize={15} collapsible order={1}>
    <SidebarNavigation />
  </Panel>
  
  <PanelResizeHandle />

  {/ --- 2. 中间核心区 --- /}
  <Panel defaultSize={50} minSize={30} order={2} className="relative">
    {/ 文档编辑器 /}
    <div className="h-full overflow-y-auto pb-32"> {/ pb-32 为了给浮动条留空间 /}
      <EditorToolbar />
      <TiptapEditor />
    </div>

    {/ [核心] 底部浮动指令栏 (绝对定位) /}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
      <ChatInput 
         variant="floating" // 浮动样式变体
         placeholder="Ask AI to edit or generate..."
      />
    </div>
  </Panel>

  <PanelResizeHandle />

  {/ --- 3. 右侧 AI 输出流 --- /}
  <Panel defaultSize={30} minSize={0} collapsible order={3}>
    <AIResponseStream /> 
    {/ 注意：这里主要负责展示 Messages，可以没有 Input，或者Input很弱化 /}
  </Panel>

</PanelGroup>
```

## 4\. 技术栈推荐更新

   Input Component: 你的 `ChatInput` 需要支持 `variant` 属性：
       `default`: 放在普通容器里。
       `floating`: 带有 `backdrop-blur`, `shadow-2xl`, `rounded-full` 等样式，用于中间悬浮。
   State Sync: 使用 `Jotai` 的 `atom` 来连接中间的 Input 和右边的 Message List。
       `const userQueryAtom = atom('')`
       当中间 Input 提交时 -\> 更新 Global Chat State -\> 右侧 Panel 监听到变化 -\> 触发 Scroll to bottom。

-----

### 核心变更总结

1.  输入框位置：从右侧栏底部 -\> 移至 中间栏底部悬浮。
2.  右侧栏职责：从“聊天室”变为 “AI 投影仪/副屏”，专注于展示结果。
3.  视觉动线：`Input (Center)` -\> `Process` -\> `Output (Right)`。

这个架构是否符合你心中的“宽屏下并行工作”的理想状态？