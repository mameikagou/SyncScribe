// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-020-magic-link-parser.md

import type { MagicLinkCommand } from '@/server/services/vibe/repo-guide/types';

const parseLineRange = (value: string | null) => {
  if (!value) {
    return null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const match = raw.match(/^(\d+)(?:-(\d+))?$/);
  if (!match) {
    return null;
  }

  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
    return null;
  }

  return {
    startLine: Math.min(start, end),
    endLine: Math.max(start, end),
  };
};

export const parseGuideLink = (href: string): MagicLinkCommand | null => {
  if (!href.startsWith('guide://')) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return null;
  }

  const action = parsed.hostname || parsed.pathname.replace(/^\/+/, '');
  const file = parsed.searchParams.get('file')?.trim();

  if (action === 'open') {
    if (!file) {
      return null;
    }

    const rangeFromLines = parseLineRange(parsed.searchParams.get('lines'));
    const startLineRaw = Number(parsed.searchParams.get('startLine'));
    const endLineRaw = Number(parsed.searchParams.get('endLine'));

    const range =
      rangeFromLines ??
      (Number.isFinite(startLineRaw)
        ? {
            startLine: Math.max(1, Math.trunc(startLineRaw)),
            endLine: Math.max(1, Math.trunc(Number.isFinite(endLineRaw) ? endLineRaw : startLineRaw)),
          }
        : null);

    if (!range) {
      return null;
    }

    return {
      action: 'open',
      file,
      startLine: Math.min(range.startLine, range.endLine),
      endLine: Math.max(range.startLine, range.endLine),
    };
  }

  if (action === 'focus') {
    const symbol = parsed.searchParams.get('symbol')?.trim();
    if (!file || !symbol) {
      return null;
    }

    return {
      action: 'focus',
      file,
      symbol,
    };
  }

  if (action === 'tree') {
    const path = parsed.searchParams.get('path')?.trim();
    if (!path) {
      return null;
    }

    return {
      action: 'tree',
      path,
    };
  }

  return null;
};

export const formatGuideLink = (cmd: MagicLinkCommand) => {
  const params = new URLSearchParams();

  if (cmd.action === 'open') {
    params.set('file', cmd.file);
    params.set('startLine', String(Math.max(1, cmd.startLine)));
    params.set('endLine', String(Math.max(1, cmd.endLine)));
    return `guide://open?${params.toString()}`;
  }

  if (cmd.action === 'focus') {
    params.set('file', cmd.file);
    params.set('symbol', cmd.symbol);
    return `guide://focus?${params.toString()}`;
  }

  params.set('path', cmd.path);
  return `guide://tree?${params.toString()}`;
};
