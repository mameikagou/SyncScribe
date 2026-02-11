import type {
  EvidenceCard,
  SessionMemory,
  ToolTraceEntry,
} from '@/server/services/vibe/repo-guide/types';

const memoryStore = new Map<string, SessionMemory>();

const nowIso = () => new Date().toISOString();

const ensureMemory = (sessionId: string): SessionMemory => {
  const existing = memoryStore.get(sessionId);
  if (existing) return existing;

  const created: SessionMemory = {
    sessionId,
    visitedFiles: [],
    keyFacts: [],
    toolTrace: [],
    evidence: [],
    updatedAt: nowIso(),
  };

  memoryStore.set(sessionId, created);
  return created;
};

const saveMemory = (memory: SessionMemory) => {
  memory.updatedAt = nowIso();
  memoryStore.set(memory.sessionId, memory);
  return memory;
};

const uniquePush = (list: string[], value: string, limit: number) => {
  if (!value) return;

  const trimmed = value.trim();
  if (!trimmed) return;

  const exists = list.some((item) => item.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    list.push(trimmed);
  }

  if (list.length > limit) {
    list.splice(0, list.length - limit);
  }
};

export const getSessionMemory = (sessionId: string) => ensureMemory(sessionId);

export const clearSessionMemory = (sessionId: string) => {
  memoryStore.delete(sessionId);
};

export const rememberVisitedFile = (sessionId: string, filePath: string) => {
  const memory = ensureMemory(sessionId);
  uniquePush(memory.visitedFiles, filePath, 80);
  saveMemory(memory);
};

export const rememberKeyFact = (sessionId: string, fact: string) => {
  const memory = ensureMemory(sessionId);
  uniquePush(memory.keyFacts, fact, 40);
  saveMemory(memory);
};

export const appendToolTrace = (sessionId: string, trace: ToolTraceEntry) => {
  const memory = ensureMemory(sessionId);
  memory.toolTrace.push(trace);
  if (memory.toolTrace.length > 60) {
    memory.toolTrace.splice(0, memory.toolTrace.length - 60);
  }
  saveMemory(memory);
};

export const appendEvidence = (sessionId: string, evidence: EvidenceCard) => {
  const memory = ensureMemory(sessionId);

  const exists = memory.evidence.some(
    (item) =>
      item.kind === evidence.kind &&
      item.path === evidence.path &&
      item.startLine === evidence.startLine &&
      item.endLine === evidence.endLine,
  );

  if (!exists) {
    memory.evidence.push(evidence);
  }

  if (memory.evidence.length > 40) {
    memory.evidence.splice(0, memory.evidence.length - 40);
  }

  saveMemory(memory);
};

export const buildMemoryBrief = (sessionId: string) => {
  const memory = ensureMemory(sessionId);
  const recentFacts = memory.keyFacts.slice(-8);
  const recentFiles = memory.visitedFiles.slice(-8);

  const parts: string[] = [];
  if (recentFacts.length > 0) {
    parts.push(`关键结论: ${recentFacts.join(' | ')}`);
  }
  if (recentFiles.length > 0) {
    parts.push(`最近查看文件: ${recentFiles.join(', ')}`);
  }

  if (parts.length === 0) {
    return '暂无历史记忆。';
  }

  return parts.join('\n');
};

export const pickPromptEvidence = (sessionId: string, maxItems = 6) => {
  const memory = ensureMemory(sessionId);
  return memory.evidence.slice(-maxItems);
};

export const pickPromptTrace = (sessionId: string, maxItems = 10) => {
  const memory = ensureMemory(sessionId);
  return memory.toolTrace.slice(-maxItems);
};
