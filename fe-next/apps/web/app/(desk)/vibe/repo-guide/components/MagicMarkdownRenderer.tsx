'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-021-magic-markdown-renderer.md

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseGuideLink } from '@/app/(desk)/vibe/repo-guide/lib/magic-link';
import type { MagicLinkCommand } from '@/server/services/vibe/repo-guide/types';

type MagicMarkdownRendererProps = {
  markdown: string;
  onCommand: (cmd: MagicLinkCommand) => void;
  onExternalLink?: (href: string) => void;
};

export default function MagicMarkdownRenderer({
  markdown,
  onCommand,
  onExternalLink,
}: MagicMarkdownRendererProps) {
  if (!markdown.trim()) {
    return <div className="text-sm text-stone-500">暂无文档内容。</div>;
  }

  return (
    <ReactMarkdown
      className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:leading-7"
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          const safeHref = href?.trim();
          if (!safeHref) {
            return <span className="text-stone-500">{children}</span>;
          }

          const command = parseGuideLink(safeHref);

          return (
            <a
              href={safeHref}
              onClick={(event) => {
                if (command) {
                  event.preventDefault();
                  try {
                    onCommand(command);
                  } catch (error) {
                    console.warn('[RepoGuide] 执行 magic command 失败', error);
                  }
                  return;
                }

                if (onExternalLink) {
                  event.preventDefault();
                  onExternalLink(safeHref);
                }
              }}
              target={command ? undefined : '_blank'}
              rel={command ? undefined : 'noreferrer'}
              className={command ? 'text-blue-600 hover:underline' : undefined}
            >
              {children}
            </a>
          );
        },
        code: ({ className, children }) => {
          const isBlock = Boolean(className);
          if (!isBlock) {
            return <code className="rounded bg-stone-100 px-1 py-0.5">{children}</code>;
          }

          return (
            <code className={`block overflow-x-auto rounded-md bg-stone-900 p-3 text-stone-100 ${className}`}>
              {children}
            </code>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
