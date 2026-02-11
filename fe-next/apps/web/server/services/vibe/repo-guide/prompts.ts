import type { AgentPhase, EvidenceCard, ToolTraceEntry } from '@/server/services/vibe/repo-guide/types';

type PlannerPromptInput = {
  question: string;
  phase: AgentPhase;
  step: number;
  maxSteps: number;
  memoryBrief: string;
  recentObservation: string;
};

type TeacherPromptInput = {
  question: string;
  evidence: EvidenceCard[];
  trace: ToolTraceEntry[];
  draft?: string;
};

export const REPO_GUIDE_PLANNER_SYSTEM_PROMPT = `
你是代码仓库阅读 Agent 的规划器。
你必须只在以下动作里选一个：
- searchSkeleton
- readInterface
- readImplementation
- answer

状态机只能按 LOCATE -> OVERVIEW -> DIG -> ANSWER 推进。
约束：
1. 每轮只允许一个动作。
2. 先定位，再读接口，再读实现。
3. 如果证据不足，不要提前 answer。
4. 输出必须是结构化 JSON。
`;

export const buildPlannerUserPrompt = (input: PlannerPromptInput) => {
  return [
    `用户问题: ${input.question}`,
    `当前阶段: ${input.phase}`,
    `当前步数: ${input.step}/${input.maxSteps}`,
    '短期记忆:',
    input.memoryBrief,
    '最近观察:',
    input.recentObservation || '无',
    '请给出下一步动作。',
  ].join('\n');
};

export const REPO_GUIDE_TEACHER_SYSTEM_PROMPT = `
你是“项目导游讲解员”，请用人话解释复杂代码。
必须遵循教学结构：
1) 直觉：一句话说清它在解决什么问题
2) 心智模型：模块和职责
3) 核心链路：数据怎么流
4) 源码锚点：给出具体文件与行号线索

风格要求：
- 避免术语堆砌
- 使用短段落和清晰小标题
- 只基于证据回答，不要编造
`;

const renderEvidence = (evidence: EvidenceCard[]) => {
  if (evidence.length === 0) return '暂无证据。';

  return evidence
    .map((item, index) => {
      return [
        `${index + 1}. [${item.kind}] ${item.path}:${item.startLine}-${item.endLine}`,
        `链接: ${item.blobUrl}`,
        `片段: ${item.snippet.slice(0, 360)}`,
      ].join('\n');
    })
    .join('\n\n');
};

const renderTrace = (trace: ToolTraceEntry[]) => {
  if (trace.length === 0) return '暂无工具轨迹。';

  return trace
    .map(
      (item) =>
        `${item.step}. ${item.phase} -> ${item.tool} | input=${JSON.stringify(item.input)} | obs=${item.observation}`,
    )
    .join('\n');
};

export const buildTeacherUserPrompt = (input: TeacherPromptInput) => {
  return [
    `用户问题: ${input.question}`,
    input.draft ? `Agent 草稿: ${input.draft}` : 'Agent 草稿: 无',
    '证据列表:',
    renderEvidence(input.evidence),
    '工具轨迹:',
    renderTrace(input.trace),
    '请输出最终讲解。',
  ].join('\n\n');
};
