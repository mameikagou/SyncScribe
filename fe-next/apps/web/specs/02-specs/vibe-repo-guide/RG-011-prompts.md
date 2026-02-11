# Spec RG-011：Prompt 组装与教学约束（Guidebook）

## 1. 目标与意图
将 Prompt 分成三类：
1) 索引问答决策（planner）
2) 讲解输出（teacher）
3) 导游文档生成（guidebook writer）

这样可以分别优化“找代码”“讲代码”“写文档”。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| Prompt 常量与组装器 | `server/services/vibe/repo-guide/prompts.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/prompts.ts`

#### 3.1 意图 (Intent)
- planner 负责下一步工具动作。
- teacher 负责问答型讲解。
- guidebook writer 负责生成可点击锚点的 Markdown 章节。

#### 3.2 核心常量与函数

##### 常量: `REPO_GUIDE_PLANNER_SYSTEM_PROMPT`
- **要求:**
  - 动作集合固定：`searchSkeleton/readInterface/readImplementation/answer`
  - 状态机顺序固定：`LOCATE -> OVERVIEW -> DIG -> ANSWER`

##### 函数: `buildPlannerUserPrompt`
- **签名:** `(input: PlannerPromptInput) => string`
- **依赖:** 无

##### 常量: `REPO_GUIDE_TEACHER_SYSTEM_PROMPT`
- **要求:**
  - 输出结构：直觉 / 心智模型 / 核心链路 / 源码锚点
  - 必须基于 evidence，禁止编造

##### 函数: `buildTeacherUserPrompt`
- **签名:** `(input: TeacherPromptInput) => string`
- **依赖:** `renderEvidence`, `renderTrace`

##### 常量: `REPO_GUIDE_GUIDEBOOK_SYSTEM_PROMPT`（新增）
- **要求:**
  - 输出 Markdown 文档
  - 必须包含至少 3 个 `guide://` 链接
  - 链接只允许 `open/focus/tree` 三类动作

##### 函数: `buildGuidebookUserPrompt`（新增）
- **签名:** `(input: { docTitle: string; question: string; evidence: EvidenceCard[]; skeletonHints: string[] }) => string`
- **依赖:** `renderEvidence`
- **伪代码:**
  1. 注入章节标题与目标读者。
  2. 注入证据与候选符号。
  3. 明确要求输出可点击锚点。

#### 3.3 辅助函数
- `renderEvidence`：截断 snippet，避免 prompt 超长。
- `renderTrace`：压缩工具轨迹。

## 4. 错误与边界
- evidence 为空时必须输出“证据不足”模板。
- guidebook writer 若未生成有效链接，调用方应触发二次修复或 fallback。

## 5. 验收标准（Acceptance Criteria）
1. Prompt 层清晰区分 planner/teacher/guidebook。
2. guidebook prompt 对 `guide://` 协议有硬约束。
3. 组装函数在空 evidence 下仍返回可执行提示词。
