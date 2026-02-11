'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-023-view-hooks.md

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { repoGuideClient } from '@/app/(desk)/vibe/repo-guide/services/repo-guide-client';
import {
  activeFileAtom,
  expandedTreeKeysAtom,
  selectedTreePathAtom,
} from '@/app/(desk)/vibe/repo-guide/store/workbench-atoms';
import type { RepoTreeVM } from '@/app/(desk)/vibe/repo-guide/types';
import type { RepoTreeNode } from '@/server/services/vibe/repo-guide/types';

const cloneTreeNodes = (nodes: RepoTreeNode[]): RepoTreeNode[] => {
  const clonedRoots = nodes.map((node) => ({ ...node }));
  const stack = [...clonedRoots];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !current.children || current.children.length === 0) {
      continue;
    }

    current.children = current.children.map((child) => ({ ...child }));
    for (let index = current.children.length - 1; index >= 0; index -= 1) {
      stack.push(current.children[index]!);
    }
  }

  return clonedRoots;
};

const attachChildren = (
  nodes: RepoTreeNode[],
  targetPath: string,
  children: RepoTreeNode[],
): RepoTreeNode[] => {
  const nextTree = cloneTreeNodes(nodes);
  const stack = [...nextTree];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (current.path === targetPath) {
      current.children = children;
      break;
    }

    if (!current.children || current.children.length === 0) {
      continue;
    }

    for (let index = current.children.length - 1; index >= 0; index -= 1) {
      stack.push(current.children[index]!);
    }
  }

  return nextTree;
};

const decorateExpandedState = (nodes: RepoTreeNode[], expanded: Set<string>): RepoTreeNode[] => {
  const nextTree = cloneTreeNodes(nodes);
  const stack = [...nextTree];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    current.isExpanded = expanded.has(current.path);

    if (!current.children || current.children.length === 0) {
      continue;
    }

    for (let index = current.children.length - 1; index >= 0; index -= 1) {
      stack.push(current.children[index]!);
    }
  }

  return nextTree;
};

export const useRepoTree = (params: {
  sessionId: string | null;
}): RepoTreeVM => {
  const [nodes, setNodes] = useState<RepoTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadedPathsRef = useRef<Set<string>>(new Set());

  const [expandedKeys, setExpandedKeys] = useAtom(expandedTreeKeysAtom);
  const [selectedPath, setSelectedPath] = useAtom(selectedTreePathAtom);
  const [, setActiveFile] = useAtom(activeFileAtom);

  useEffect(() => {
    if (!params.sessionId) {
      setNodes([]);
      setError(null);
      setExpandedKeys([]);
      setSelectedPath(null);
      loadedPathsRef.current = new Set();
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    repoGuideClient
      .getRepoTree({ sessionId: params.sessionId })
      .then((result) => {
        if (!active) return;
        setNodes(result);
        loadedPathsRef.current = new Set(['']);
      })
      .catch((requestError) => {
        if (!active) return;
        setNodes([]);
        setError((requestError as Error).message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.sessionId, setExpandedKeys, setSelectedPath]);

  const onExpand = useCallback(
    (path: string) => {
      if (!params.sessionId) return;

      const nextExpanded = expandedKeys.includes(path)
        ? expandedKeys.filter((item) => item !== path)
        : [...expandedKeys, path];

      setExpandedKeys(nextExpanded);

      if (loadedPathsRef.current.has(path)) {
        return;
      }

      setIsLoading(true);
      setError(null);

      repoGuideClient
        .getRepoTree({
          sessionId: params.sessionId,
          path,
        })
        .then((children) => {
          setNodes((current) => attachChildren(current, path, children));
          loadedPathsRef.current.add(path);
        })
        .catch((requestError) => {
          setError((requestError as Error).message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [expandedKeys, params.sessionId, setExpandedKeys],
  );

  const onSelect = useCallback(
    (path: string) => {
      setSelectedPath(path);
      setActiveFile(path);
    },
    [setActiveFile, setSelectedPath],
  );

  const decoratedNodes = useMemo(() => {
    return decorateExpandedState(nodes, new Set(expandedKeys));
  }, [expandedKeys, nodes]);

  return {
    nodes: decoratedNodes,
    expandedKeys,
    selectedPath,
    isLoading,
    error,
    onExpand,
    onSelect,
  };
};
