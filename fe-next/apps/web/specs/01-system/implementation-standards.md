# System-05：实现标准（Builder/Auditor 执行约束）

## 1. 前端标准（MVVM 变体）

### 1.1 View 文件（Dumb）
- 仅渲染：DOM/Tailwind/事件绑定。
- 输入仅来自 props。
- 禁止：`fetch`、业务计算、复杂 `useEffect`。
- 命名：`*.tsx`，放在 `components/`。

### 1.2 Logic Hook 文件（Headless）
- 负责：请求调用、状态合并、数据转换、副作用。
- 输出：给 View 的最小数据模型（ViewModel）。
- 命名：`use*.ts`，放在 `hooks/`。

### 1.3 四列布局硬约束
- 必须存在：`GuideExplorer` / `DocReader` / `CodeEditorPane` / `RepoTree`。
- 宽度策略：两侧固定，中间可调；小屏降级抽屉。

### 1.4 Markdown 魔法链接约束
- 仅允许 `guide://` 前缀被拦截执行。
- 非法链接必须 fail-safe（不崩溃）。
- 所有动作必须先转换成 `MagicLinkCommand` 再进入 store。

## 2. 后端标准（三层）

### 2.1 Controller（Hono Router）
- 只做：参数解析、Zod 校验、调用 Service、HTTP 返回。
- 禁止写业务细节（索引扫描/AI prompt 拼接/Map 操作）。

### 2.2 Service
- 只做业务编排与规则判断。
- 禁止依赖 `Context` 或 `c.json()`。
- 复杂函数必须有 Spec 章节可追踪。

### 2.3 Repository
- 封装内存或 Prisma 读写。
- Service 只能通过 repository API 读写状态。

## 3. 类型与契约
- Router 入参与出参必须来自共享类型。
- 任何字段变更先改 `specs` 再改代码。
- Magic Link 协议变更需同步更新：
  - `01-system/api-contract.md`
  - 前端解析器 Spec
  - 相关 E2E 用例

## 4. 测试与验收规则
- 每个 Hook 至少覆盖：成功、失败、空数据三路径。
- Magic Link 解析至少覆盖：open/focus/tree/非法链接。
- 索引状态机覆盖：`CREATED -> INDEXING -> READY/FAILED`。

## 5. Traceability 规则
- 复杂函数注释中必须带 Spec 编号（例：`// Spec: RG-023 §3.2`）。
