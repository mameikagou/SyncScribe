# Spec RG-012：Agent Loop 状态机执行

## 1. 目标与意图
在限定步数内完成“定位 -> 概览 -> 深读 -> 讲解”，并保证任何模型失败都可回退。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| Agent 主循环与决策执行 | `server/services/vibe/repo-guide/agent-loop.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/agent-loop.ts`

#### 3.1 意图 (Intent)
- 把 LLM 行为限制在可审计状态机内。
- 将“工具执行”和“答案生成”分离，方便排错。

#### 3.2 核心函数

##### 函数: `runRepoGuideAgentLoop`
- **签名:** `(input: { sessionId: string; question: string; maxSteps?: number; }) => Promise<RepoGuideAnswer>`
- **依赖:**
  - Planner/Teacher：`generateObject`, `generateText`, `deepseek`
  - 工具：`searchSkeleton`, `readInterface`, `readImplementation`
  - 记忆：`appendToolTrace`, `rememberKeyFact`, `pickPromptEvidence`, `pickPromptTrace`
  - Prompt：`buildPlannerUserPrompt`, `buildTeacherUserPrompt`
- **伪代码:**
  1. 校验 session 必须 READY；校验 question 非空。
  2. 规范化 `maxSteps`。
  3. 进入 for-loop（1..maxSteps）：
     - 调 planner 产出下一步动作（失败则 fallbackDecision）。
     - 按 action 执行对应工具。
     - 写 memory（trace/keyFact/evidence）。
     - 根据命中结果推进 phase。
     - 若 action=answer 或证据足够则 break。
  4. 收集 evidence/trace。
  5. 调 teacher 生成最终讲解（失败则 fallbackAnswer）。
  6. 返回 `RepoGuideAnswer`。

##### 函数: `planNextStep`
- **签名:** `(input: {...}) => Promise<AgentToolDecision>`
- **意图:** planner 调用封装 + 统一回退。

##### 函数: `fallbackDecision`
- **签名:** `(phase: AgentPhase, question: string, hits: SearchSkeletonHit[]) => AgentToolDecision`
- **意图:** 当 planner 不可用时仍能推进状态机。

##### 函数: `fallbackAnswer`
- **签名:** `(question: string, evidence: RepoGuideAnswer["evidence"]) => string`
- **意图:** teacher 失败时保证 API 不空返回。

## 4. 错误与边界
- session 非 READY：直接拒绝 ask。
- planner 返回非法路径：回退到 hits[0] 或 LOCATE。
- ask 结束时可能 phase 仍为 DIG（步数耗尽），但必须返回 answer。

## 5. 验收标准（Acceptance Criteria）
1. loop 最多执行 `maxSteps` 次，不得死循环。
2. planner 故障时，fallback 仍可完成至少一次工具调用。
3. teacher 故障时，fallbackAnswer 输出包含问题与证据落点。
4. 返回结构包含 `answer/phase/stepsUsed/evidence/toolTrace`。
5. 工具调用轨迹中每步都带 `step/phase/tool/input/observation/at`。
