import { generateObject, generateText } from 'ai';
import { z } from 'zod';

import { deepseek } from '@/lib/ai';
import {
  appendToolTrace,
  buildMemoryBrief,
  pickPromptEvidence,
  pickPromptTrace,
  rememberKeyFact,
} from '@/server/services/vibe/repo-guide/memory';
import {
  buildPlannerUserPrompt,
  buildTeacherUserPrompt,
  REPO_GUIDE_PLANNER_SYSTEM_PROMPT,
  REPO_GUIDE_TEACHER_SYSTEM_PROMPT,
} from '@/server/services/vibe/repo-guide/prompts';
import { requireRepoGuideSession } from '@/server/services/vibe/repo-guide/session';
import { readImplementation, readInterface, searchSkeleton } from '@/server/services/vibe/repo-guide/tools';
import type {
  AgentPhase,
  AgentToolDecision,
  RepoGuideAnswer,
  SearchSkeletonHit,
} from '@/server/services/vibe/repo-guide/types';

const phaseSchema = z.enum(['LOCATE', 'OVERVIEW', 'DIG', 'ANSWER']);

const plannerDecisionSchema = z.object({
  phase: phaseSchema,
  reason: z.string().max(300).optional(),
  action: z.enum(['searchSkeleton', 'readInterface', 'readImplementation', 'answer']),
  query: z.string().max(120).optional(),
  path: z.string().max(500).optional(),
  symbolName: z.string().max(160).optional(),
  startLine: z.number().int().min(1).max(300000).optional(),
  endLine: z.number().int().min(1).max(300000).optional(),
  draftAnswer: z.string().max(6000).optional(),
});

const clampSteps = (value?: number) => {
  if (value == null) return 8;
  return Math.max(4, Math.min(10, Math.trunc(value)));
};

const fallbackDecision = (
  phase: AgentPhase,
  question: string,
  hits: SearchSkeletonHit[],
): AgentToolDecision => {
  if (phase === 'LOCATE') {
    return {
      phase,
      action: 'searchSkeleton',
      query: question.slice(0, 80),
      reason: '先按关键词定位候选文件',
    };
  }

  if (phase === 'OVERVIEW') {
    return {
      phase,
      action: 'readInterface',
      path: hits[0]?.path,
      reason: '先看接口结构，确认主模块职责',
    };
  }

  if (phase === 'DIG') {
    return {
      phase,
      action: 'readImplementation',
      path: hits[0]?.path,
      reason: '读取实现细节，拿到关键证据',
    };
  }

  return {
    phase,
    action: 'answer',
    draftAnswer: '我已经拿到足够证据，可以开始讲解。',
  };
};

const planNextStep = async (input: {
  question: string;
  phase: AgentPhase;
  step: number;
  maxSteps: number;
  memoryBrief: string;
  recentObservation: string;
  hits: SearchSkeletonHit[];
}): Promise<AgentToolDecision> => {
  try {
    const { object } = await generateObject({
      model: deepseek.chat('deepseek-chat'),
      schema: plannerDecisionSchema,
      temperature: 0,
      system: REPO_GUIDE_PLANNER_SYSTEM_PROMPT,
      prompt: [
        buildPlannerUserPrompt({
          question: input.question,
          phase: input.phase,
          step: input.step,
          maxSteps: input.maxSteps,
          memoryBrief: input.memoryBrief,
          recentObservation: input.recentObservation,
        }),
        input.hits.length > 0
          ? `最近一次 search 命中:\n${input.hits
              .slice(0, 5)
              .map((hit, idx) => `${idx + 1}. ${hit.path} (${hit.matchedSymbols.join(', ') || 'no symbols'})`)
              .join('\n')}`
          : '最近一次 search 命中: 无',
      ].join('\n\n'),
    });

    return object;
  } catch {
    return fallbackDecision(input.phase, input.question, input.hits);
  }
};

const fallbackAnswer = (question: string, evidence: RepoGuideAnswer['evidence']) => {
  const evidenceLines = evidence
    .map((item) => `- ${item.path}:${item.startLine}-${item.endLine}`)
    .join('\n');

  return [
    `你问的是：${question}`,
    '我已经按“先定位、再概览、再深读”的顺序读了相关代码。',
    '当前证据落点：',
    evidenceLines || '- 暂无稳定证据（建议继续读实现）',
  ].join('\n');
};

export const runRepoGuideAgentLoop = async (input: {
  sessionId: string;
  question: string;
  maxSteps?: number;
}): Promise<RepoGuideAnswer> => {
  const session = requireRepoGuideSession(input.sessionId);
  if (session.state !== 'READY') {
    throw new Error('索引尚未就绪，请先调用 /index 并等待 READY');
  }

  const question = input.question.trim();
  if (!question) {
    throw new Error('question 不能为空');
  }

  const maxSteps = clampSteps(input.maxSteps);

  let phase: AgentPhase = 'LOCATE';
  let recentObservation = '';
  let latestHits: SearchSkeletonHit[] = [];
  let draftAnswer = '';
  let stepsUsed = 0;

  for (let step = 1; step <= maxSteps; step += 1) {
    const decision = await planNextStep({
      question,
      phase,
      step,
      maxSteps,
      memoryBrief: buildMemoryBrief(input.sessionId),
      recentObservation,
      hits: latestHits,
    });

    if (decision.action === 'answer') {
      draftAnswer = decision.draftAnswer?.trim() ?? draftAnswer;
      stepsUsed = step;
      phase = 'ANSWER';
      break;
    }

    if (decision.action === 'searchSkeleton') {
      const query = decision.query?.trim() || question;
      latestHits = searchSkeleton(input.sessionId, query, 8);
      recentObservation =
        latestHits.length > 0
          ? `命中 ${latestHits.length} 个候选文件，Top1=${latestHits[0]!.path}`
          : '没有命中候选文件';

      rememberKeyFact(input.sessionId, recentObservation);
      appendToolTrace(input.sessionId, {
        step,
        phase,
        tool: 'searchSkeleton',
        input: { query },
        observation: recentObservation,
        at: new Date().toISOString(),
      });

      phase = latestHits.length > 0 ? 'OVERVIEW' : 'LOCATE';
      stepsUsed = step;
      continue;
    }

    if (decision.action === 'readInterface') {
      const path = decision.path?.trim() || latestHits[0]?.path;
      if (!path) {
        recentObservation = 'readInterface 缺少 path，回退到 LOCATE';
        phase = 'LOCATE';
        stepsUsed = step;
        continue;
      }

      const snapshot = await readInterface(input.sessionId, path);
      recentObservation = `已读取接口 ${snapshot.path}:${snapshot.startLine}-${snapshot.endLine}`;
      rememberKeyFact(input.sessionId, recentObservation);

      appendToolTrace(input.sessionId, {
        step,
        phase,
        tool: 'readInterface',
        input: { path },
        observation: recentObservation,
        at: new Date().toISOString(),
      });

      phase = 'DIG';
      stepsUsed = step;
      continue;
    }

    if (decision.action === 'readImplementation') {
      const path = decision.path?.trim() || latestHits[0]?.path;
      if (!path) {
        recentObservation = 'readImplementation 缺少 path，回退到 LOCATE';
        phase = 'LOCATE';
        stepsUsed = step;
        continue;
      }

      const snapshot = await readImplementation({
        sessionId: input.sessionId,
        path,
        symbolName: decision.symbolName,
        startLine: decision.startLine,
        endLine: decision.endLine,
      });

      recentObservation = `已读取实现 ${snapshot.path}:${snapshot.startLine}-${snapshot.endLine}`;
      rememberKeyFact(input.sessionId, recentObservation);

      appendToolTrace(input.sessionId, {
        step,
        phase,
        tool: 'readImplementation',
        input: {
          path,
          symbolName: decision.symbolName,
          startLine: decision.startLine,
          endLine: decision.endLine,
        },
        observation: recentObservation,
        at: new Date().toISOString(),
      });

      phase = pickPromptEvidence(input.sessionId, 99).length >= 2 ? 'ANSWER' : 'DIG';
      stepsUsed = step;
      if (phase === 'ANSWER') {
        break;
      }
    }
  }

  const evidence = pickPromptEvidence(input.sessionId, 8);
  const trace = pickPromptTrace(input.sessionId, 16);

  let answer = draftAnswer;

  try {
    const { text } = await generateText({
      model: deepseek.chat('deepseek-chat'),
      temperature: 0.2,
      system: REPO_GUIDE_TEACHER_SYSTEM_PROMPT,
      prompt: buildTeacherUserPrompt({
        question,
        evidence,
        trace,
        draft: draftAnswer,
      }),
    });

    answer = text.trim();
  } catch {
    answer = answer || fallbackAnswer(question, evidence);
  }

  return {
    answer,
    phase,
    stepsUsed,
    evidence,
    toolTrace: trace,
  };
};
