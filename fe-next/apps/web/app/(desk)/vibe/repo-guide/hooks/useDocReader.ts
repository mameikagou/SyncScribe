'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-023-view-hooks.md

import { useCallback, useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import { repoGuideClient } from '@/app/(desk)/vibe/repo-guide/services/repo-guide-client';
import { executeMagicCommandAtom } from '@/app/(desk)/vibe/repo-guide/store/workbench-atoms';
import type { DocReaderVM } from '@/app/(desk)/vibe/repo-guide/types';
import type { GuideDoc, MagicLinkCommand } from '@/server/services/vibe/repo-guide/types';

export const useDocReader = (params: {
  sessionId: string | null;
  docId: string | null;
}): DocReaderVM => {
  const dispatchMagicCommand = useSetAtom(executeMagicCommandAtom);
  const [doc, setDoc] = useState<GuideDoc | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.sessionId || !params.docId) {
      setDoc(null);
      setError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    repoGuideClient
      .getGuideDoc({
        sessionId: params.sessionId,
        docId: params.docId,
      })
      .then((value) => {
        if (!active) return;
        setDoc(value);
      })
      .catch((requestError) => {
        if (!active) return;
        setError((requestError as Error).message);
        setDoc(null);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.docId, params.sessionId]);

  const onMagicCommand = useCallback(
    (cmd: MagicLinkCommand) => {
      dispatchMagicCommand(cmd);
    },
    [dispatchMagicCommand],
  );

  return {
    doc,
    isLoading,
    error,
    onMagicCommand,
  };
};
