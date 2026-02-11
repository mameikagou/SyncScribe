export type IndexState = 'CREATED' | 'INDEXING' | 'READY' | 'FAILED';

export type RepoGuideSession = {
  sessionId: string;
  repoUrl: string;
  branch: string;
  repoKey: string;
  state: IndexState;
  createdAt: string;
  updatedAt: string;
  error?: string;
};

export type RepoManifestEntry = {
  path: string;
  language: string;
  size: number;
  hash: string;
  indexable: boolean;
};

export type RepoManifest = {
  repoKey: string;
  generatedAt: string;
  totalDirectories: number;
  totalFiles: number;
  truncated: boolean;
  entries: RepoManifestEntry[];
};

export type SkeletonSymbol = {
  kind: 'class' | 'function' | 'method' | 'interface' | 'type' | 'const' | 'export';
  name: string;
  signature?: string;
  line?: number;
};

export type SkeletonFile = {
  path: string;
  language: string;
  symbols: SkeletonSymbol[];
};

export type SkeletonIndex = {
  repoKey: string;
  generatedAt: string;
  files: SkeletonFile[];
};

export type SearchSkeletonHit = {
  path: string;
  score: number;
  matchedSymbols: string[];
};

export type InterfaceSnapshot = {
  path: string;
  language: string;
  content: string;
  startLine: number;
  endLine: number;
  blobUrl: string;
};

export type ImplementationSnapshot = {
  path: string;
  language: string;
  content: string;
  startLine: number;
  endLine: number;
  blobUrl: string;
};

export type AgentPhase = 'LOCATE' | 'OVERVIEW' | 'DIG' | 'ANSWER';

export type AgentToolName = 'searchSkeleton' | 'readInterface' | 'readImplementation';

export type ToolTraceEntry = {
  step: number;
  phase: AgentPhase;
  tool: AgentToolName;
  input: Record<string, unknown>;
  observation: string;
  at: string;
};

export type EvidenceKind = 'interface' | 'implementation';

export type EvidenceCard = {
  kind: EvidenceKind;
  path: string;
  startLine: number;
  endLine: number;
  blobUrl: string;
  snippet: string;
};

export type SessionMemory = {
  sessionId: string;
  visitedFiles: string[];
  keyFacts: string[];
  toolTrace: ToolTraceEntry[];
  evidence: EvidenceCard[];
  updatedAt: string;
};

export type RepoGuideIndexStats = {
  totalFiles: number;
  indexableFiles: number;
  skeletonFiles: number;
  symbolCount: number;
};

export type RepoGuideIndexStatus = {
  sessionId: string;
  repoKey: string;
  state: IndexState;
  progress: number;
  stats: RepoGuideIndexStats;
  updatedAt: string;
  error?: string;
};

export type AgentToolDecision = {
  phase: AgentPhase;
  reason?: string;
  action: AgentToolName | 'answer';
  query?: string;
  path?: string;
  symbolName?: string;
  startLine?: number;
  endLine?: number;
  draftAnswer?: string;
};

export type RepoGuideAnswer = {
  answer: string;
  phase: AgentPhase;
  stepsUsed: number;
  evidence: EvidenceCard[];
  toolTrace: ToolTraceEntry[];
};
