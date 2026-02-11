'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-016-page-entry.md
// - specs/02-specs/vibe-repo-guide/RG-023-view-hooks.md
// - specs/02-specs/vibe-repo-guide/RG-024-repo-guide-client.md

import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCodeEditorPane } from '@/app/(desk)/vibe/repo-guide/hooks/useCodeEditorPane';
import { useDocReader } from '@/app/(desk)/vibe/repo-guide/hooks/useDocReader';
import { useGuideExplorer } from '@/app/(desk)/vibe/repo-guide/hooks/useGuideExplorer';
import { useRepoTree } from '@/app/(desk)/vibe/repo-guide/hooks/useRepoTree';
import { repoGuideClient } from '@/app/(desk)/vibe/repo-guide/services/repo-guide-client';
import {
  activeDocIdAtom,
  activeFileAtom,
  expandedTreeKeysAtom,
  focusModeAtom,
  highlightRangeAtom,
  selectedTreePathAtom,
} from '@/app/(desk)/vibe/repo-guide/store/workbench-atoms';
import type { RepoGuideWorkbenchVM, SessionResponse, WorkbenchPanelSizes } from '@/app/(desk)/vibe/repo-guide/types';
import type { RepoGuideIndexStatus } from '@/server/services/vibe/repo-guide/types';

const DEFAULT_REPO_URL = 'https://github.com/HKUDS/nanobot';
const DEFAULT_BRANCH = 'main';

const DEFAULT_PANEL_SIZES: WorkbenchPanelSizes = {
  explorer: 18,
  doc: 50,
  code: 50,
  tree: 18,
};

export const useRepoGuideWorkbench = (): RepoGuideWorkbenchVM => {
  const [repoUrl, setRepoUrl] = useState(DEFAULT_REPO_URL);
  const [branch, setBranch] = useState(DEFAULT_BRANCH);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [status, setStatus] = useState<RepoGuideIndexStatus | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDocId = useAtomValue(activeDocIdAtom);
  const setActiveDocId = useSetAtom(activeDocIdAtom);
  const setActiveFile = useSetAtom(activeFileAtom);
  const setHighlightRange = useSetAtom(highlightRangeAtom);
  const setFocusMode = useSetAtom(focusModeAtom);
  const setExpandedTreeKeys = useSetAtom(expandedTreeKeysAtom);
  const setSelectedTreePath = useSetAtom(selectedTreePathAtom);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const guideExplorer = useGuideExplorer({ sessionId: session?.sessionId ?? null });
  const docReader = useDocReader({
    sessionId: session?.sessionId ?? null,
    docId: activeDocId,
  });
  const codeEditor = useCodeEditorPane({ sessionId: session?.sessionId ?? null });
  const repoTree = useRepoTree({ sessionId: session?.sessionId ?? null });

  const resetWorkbenchStore = useCallback(() => {
    setActiveDocId(null);
    setActiveFile(null);
    setHighlightRange(null);
    setFocusMode({ enabled: false });
    setExpandedTreeKeys([]);
    setSelectedTreePath(null);
  }, [setActiveDocId, setActiveFile, setExpandedTreeKeys, setFocusMode, setHighlightRange, setSelectedTreePath]);

  const clearPolling = useCallback(() => {
    if (!pollingRef.current) {
      return;
    }

    clearInterval(pollingRef.current);
    pollingRef.current = null;
  }, []);

  const pollStatus = useCallback(async () => {
    if (!session?.sessionId) {
      return;
    }

    try {
      const nextStatus = await repoGuideClient.getStatus(session.sessionId);
      setStatus(nextStatus);

      if (nextStatus.state === 'READY' || nextStatus.state === 'FAILED') {
        setIsIndexing(false);
        clearPolling();
      }
    } catch (requestError) {
      setIsIndexing(false);
      clearPolling();
      setError((requestError as Error).message);
    }
  }, [clearPolling, session?.sessionId]);

  const createSession = useCallback(async () => {
    setIsBootstrapping(true);
    setError(null);

    try {
      clearPolling();
      resetWorkbenchStore();

      const nextSession = await repoGuideClient.createSession({
        repoUrl,
        branch: branch.trim() || undefined,
      });

      setSession(nextSession);
      setStatus(null);
      setIsIndexing(false);
    } catch (requestError) {
      setError((requestError as Error).message);
      setSession(null);
      setStatus(null);
    } finally {
      setIsBootstrapping(false);
    }
  }, [branch, clearPolling, repoUrl, resetWorkbenchStore]);

  const startIndex = useCallback(async () => {
    if (!session?.sessionId) {
      return;
    }

    setIsIndexing(true);
    setError(null);

    try {
      const kickoff = await repoGuideClient.startIndex({ sessionId: session.sessionId });
      setStatus(kickoff.status);
      await pollStatus();
    } catch (requestError) {
      setIsIndexing(false);
      setError((requestError as Error).message);
    }
  }, [pollStatus, session?.sessionId]);

  const loadManifest = useCallback(async () => {
    await guideExplorer.reload();
  }, [guideExplorer.reload]);

  const loadDoc = useCallback(
    async (docId: string) => {
      guideExplorer.onSelectDoc(docId);
    },
    [guideExplorer.onSelectDoc],
  );

  useEffect(() => {
    if (status?.state !== 'INDEXING' || !session?.sessionId) {
      clearPolling();
      return;
    }

    clearPolling();
    pollingRef.current = setInterval(() => {
      void pollStatus();
    }, 1800);

    return () => {
      clearPolling();
    };
  }, [clearPolling, pollStatus, session?.sessionId, status?.state]);

  useEffect(() => {
    if (status?.state !== 'READY') {
      return;
    }

    void loadManifest();
  }, [loadManifest, status?.state]);

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  const mergedError = useMemo(() => {
    return error || guideExplorer.error || docReader.error || codeEditor.error || repoTree.error || null;
  }, [codeEditor.error, docReader.error, error, guideExplorer.error, repoTree.error]);

  return {
    repoUrl,
    branch,
    setRepoUrl,
    setBranch,
    session,
    status,
    isBootstrapping,
    isIndexing,
    error: mergedError,
    createSession,
    startIndex,
    pollStatus,
    loadManifest,
    loadDoc,
    guideExplorer,
    docReader,
    codeEditor,
    repoTree,
    panelSizes: DEFAULT_PANEL_SIZES,
  };
};
