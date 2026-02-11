'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-023-view-hooks.md

import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { repoGuideClient } from '@/app/(desk)/vibe/repo-guide/services/repo-guide-client';
import { activeFileAtom, highlightRangeAtom } from '@/app/(desk)/vibe/repo-guide/store/workbench-atoms';
import type { CodeEditorVM } from '@/app/(desk)/vibe/repo-guide/types';

export const useCodeEditorPane = (params: {
  sessionId: string | null;
}): CodeEditorVM => {
  const activeFile = useAtomValue(activeFileAtom);
  const highlightRange = useAtomValue(highlightRangeAtom);

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('text');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!params.sessionId || !activeFile) {
      setCode('');
      setLanguage('text');
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    repoGuideClient
      .getRepoFile({
        sessionId: params.sessionId,
        path: activeFile,
        startLine: highlightRange?.startLine,
        endLine: highlightRange?.endLine,
      })
      .then((snapshot) => {
        if (!active) return;
        setCode(snapshot.content);
        setLanguage(snapshot.language || 'text');
      })
      .catch((requestError) => {
        if (!active) return;
        setError((requestError as Error).message);
        setCode('');
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeFile, highlightRange?.endLine, highlightRange?.startLine, params.sessionId]);

  return {
    code,
    language,
    filePath: activeFile,
    highlightRange,
    isLoading,
    error,
  };
};
