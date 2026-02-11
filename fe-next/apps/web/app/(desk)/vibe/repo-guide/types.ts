// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-001-types.md
// - specs/02-specs/vibe-repo-guide/RG-016-page-entry.md

import type {
  GuideDoc,
  GuideManifest,
  ImplementationSnapshot,
  MagicLinkCommand,
  RepoGuideIndexStatus,
  RepoGuideSession,
  RepoTreeNode,
} from '@/server/services/vibe/repo-guide/types';

export type SessionResponse = Pick<RepoGuideSession, 'sessionId' | 'repoKey' | 'state' | 'branch'>;

export type IndexKickoffResponse = {
  accepted: true;
  running: true;
  status: RepoGuideIndexStatus;
};

export type FileSnapshot = ImplementationSnapshot;

export type WorkbenchPanelSizes = {
  explorer: number;
  doc: number;
  code: number;
  tree: number;
};

export type GuideExplorerItemVM = {
  id: string;
  title: string;
  summary: string;
  categoryId: string;
  categoryTitle: string;
  isActive: boolean;
};

export type GuideExplorerVM = {
  categories: GuideManifest['categories'];
  activeDocId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectDoc: (docId: string) => void;
  reload: () => Promise<void>;
};

export type DocReaderVM = {
  doc: GuideDoc | null;
  isLoading: boolean;
  error: string | null;
  onMagicCommand: (cmd: MagicLinkCommand) => void;
};

export type CodeEditorVM = {
  code: string;
  language: string;
  filePath: string | null;
  highlightRange: { startLine: number; endLine: number } | null;
  isLoading: boolean;
  error: string | null;
};

export type RepoTreeVM = {
  nodes: RepoTreeNode[];
  expandedKeys: string[];
  selectedPath: string | null;
  isLoading: boolean;
  error: string | null;
  onExpand: (path: string) => void;
  onSelect: (path: string) => void;
};

export type RepoGuideWorkbenchVM = {
  repoUrl: string;
  branch: string;
  setRepoUrl: (value: string) => void;
  setBranch: (value: string) => void;
  session: SessionResponse | null;
  status: RepoGuideIndexStatus | null;
  isBootstrapping: boolean;
  isIndexing: boolean;
  error: string | null;
  createSession: () => Promise<void>;
  startIndex: () => Promise<void>;
  pollStatus: () => Promise<void>;
  loadManifest: () => Promise<void>;
  loadDoc: (docId: string) => Promise<void>;
  guideExplorer: GuideExplorerVM;
  docReader: DocReaderVM;
  codeEditor: CodeEditorVM;
  repoTree: RepoTreeVM;
  panelSizes: WorkbenchPanelSizes;
};
