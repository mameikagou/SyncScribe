// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-022-workbench-store.md

import { atom } from 'jotai';
import type { MagicLinkCommand } from '@/server/services/vibe/repo-guide/types';

export const activeDocIdAtom = atom<string | null>(null);
export const activeFileAtom = atom<string | null>(null);
export const highlightRangeAtom = atom<{ startLine: number; endLine: number } | null>(null);
export const focusModeAtom = atom<{ enabled: boolean; symbol?: string }>({ enabled: false });
export const expandedTreeKeysAtom = atom<string[]>([]);
export const selectedTreePathAtom = atom<string | null>(null);

const toTreePathChain = (inputPath: string) => {
  const normalized = inputPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) {
    return [];
  }

  const segments = normalized.split('/').filter(Boolean);
  const result: string[] = [];

  for (let index = 1; index <= segments.length; index += 1) {
    result.push(segments.slice(0, index).join('/'));
  }

  return result;
};

const mergeUnique = (left: string[], right: string[]) => {
  const set = new Set(left);
  for (const item of right) {
    set.add(item);
  }
  return [...set];
};

export const executeMagicCommandAtom = atom(
  null,
  (get, set, cmd: MagicLinkCommand) => {
    if (cmd.action === 'open') {
      const startLine = Math.min(cmd.startLine, cmd.endLine);
      const endLine = Math.max(cmd.startLine, cmd.endLine);

      set(activeFileAtom, cmd.file);
      set(highlightRangeAtom, { startLine, endLine });
      set(focusModeAtom, { enabled: false });
      set(selectedTreePathAtom, cmd.file);
      set(expandedTreeKeysAtom, (current) => mergeUnique(current, toTreePathChain(cmd.file)));
      return;
    }

    if (cmd.action === 'focus') {
      if (!cmd.symbol.trim()) {
        console.warn('[RepoGuide] focus 命令缺少 symbol，已忽略');
        return;
      }

      set(activeFileAtom, cmd.file);
      set(highlightRangeAtom, null);
      set(focusModeAtom, { enabled: true, symbol: cmd.symbol });
      set(selectedTreePathAtom, cmd.file);
      set(expandedTreeKeysAtom, (current) => mergeUnique(current, toTreePathChain(cmd.file)));
      return;
    }

    set(selectedTreePathAtom, cmd.path || null);
    set(expandedTreeKeysAtom, (current) => mergeUnique(current, toTreePathChain(cmd.path)));

    if (!get(activeFileAtom)) {
      set(highlightRangeAtom, null);
      set(focusModeAtom, { enabled: false });
    }
  },
);
