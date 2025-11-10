# AI SDK — Chat UI 快速参考

原文档参考：https://ai-sdk.dev/docs/ai-sdk-ui/chatbot

以下把 `useChat` 与相关功能整理为便于查阅的要点。

## 快速搭建功能组件

在实现基本的聊天和状态管理（例如 `status`）之外，`useChat`/AI SDK
提供若干常用功能：

### 流控制（Stop / Regenerate）

- `stop()`：`useChat` 返回的函数，用于中断当前正在进行的 AI 流式响应。
- `regenerate()`：`useChat` 返回的函数，用于重新生成上一个 AI
  回复（相当于重试）。

### 错误处理（Error Handling）

- `error`：`useChat` 返回的错误对象，可以用于在 UI 上显示错误提示。
- `reload()`：文档中有时称为 `regenerate`，但这里 `reload()`
  常用于重试请求。具体名称请以 SDK 版本为准。

### 消息状态（Message State）

- `setMessages`：`useChat` 提供的函数，行为类似 `React.useState` 的
  setter，允许手动修改 `messages` 数组（例如实现删除或编辑消息）。

### 请求定制（Request Configuration）

- 可通过传入 `transport` 对象到 `useChat`，全局定制 API 路径、headers、body 等。
- 在调用 `sendMessage` 时，可传入第二个参数覆盖 headers 或
  body（对单次调用传递动态 token 很有用）。

示例：

```ts
// 伪代码示例
sendMessage("Hello", { headers: { Authorization: `Bearer ${token}` } });
```

### 元数据（Metadata）与 Token 统计

- 后端可以在 `toUIMessageStreamResponse` 中附加 `messageMetadata`，例如
  `totalTokens`、`createdAt` 等。
- 前端可在 `message.metadata` 中读取这些字段并展示给用户（例如“本次消耗 150
  tokens”）。

### 多模态 / 附件（Multi-modality / Files）

- 发送附件：`sendMessage` 支持传入 `files` 属性（通常来源于
  `<input type="file">`），用于上传图片或文件。
- 渲染附件：在消息中，`message.parts` 数组会包含 `part.type === 'file'`
  的条目，可通过 `part.mediaType` 判断并渲染（例如用 `<img>` 显示图片）。

### 高级流式内容（Reasoning & Sources）

- Reasoning（思考过程）：后端设置 `sendReasoning: true` 时，前端会在 `parts`
  中收到 `part.type === 'reasoning'`，用于展示模型的中间思考步骤（如 DeepSeek
  Reasoner 支持）。
- Sources（引用来源）：后端设置 `sendSources: true` 时，前端会收到
  `part.type === 'source-url'`，可用于渲染 AI 回复的引用链接（Perplexity
  模型支持）。

### 工具类型安全（Tool Types）

- 文档提到 `InferUITool` 与 `InferUITools`，这些类型与 Zod schema 配合使用，可在
  TypeScript 中为工具调用（Tools）实现类型安全。

---

如果你希望，我可以：

- 在项目中添加一份更详细的示例（含 `useChat`
  初始化、`sendMessage`、文件上传和展示 `message.metadata`）;
- 或者把这份整理后的文档同步到项目的其他文档位置。请选择下一步操作。
