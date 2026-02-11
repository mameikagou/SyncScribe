'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-017-workbench-ui.md

import type { ReactNode } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { WorkbenchPanelSizes } from '@/app/(desk)/vibe/repo-guide/types';

type QuadWorkbenchLayoutProps = {
  panelSizes: WorkbenchPanelSizes;
  explorer: ReactNode;
  doc: ReactNode;
  code: ReactNode;
  tree: ReactNode;
};

function ResizeHandle() {
  return <PanelResizeHandle className="w-1 bg-stone-200 hover:bg-stone-300" />;
}

export default function QuadWorkbenchLayout({
  panelSizes,
  explorer,
  doc,
  code,
  tree,
}: QuadWorkbenchLayoutProps) {
  return (
    <div className="h-[calc(100vh-220px)] min-h-[620px] overflow-hidden rounded-md border border-stone-200 bg-white">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={panelSizes.explorer} minSize={12} maxSize={25}>
          <section className="h-full border-r border-stone-200">
            <header className="border-b border-stone-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Guide Explorer
            </header>
            {explorer}
          </section>
        </Panel>

        <ResizeHandle />

        <Panel minSize={40}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={panelSizes.doc} minSize={35}>
              <section className="h-full border-r border-stone-200">
                <header className="border-b border-stone-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Doc Reader
                </header>
                {doc}
              </section>
            </Panel>

            <ResizeHandle />

            <Panel defaultSize={panelSizes.code} minSize={35}>
              <section className="h-full border-r border-stone-200">
                <header className="border-b border-stone-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Code Editor
                </header>
                {code}
              </section>
            </Panel>
          </PanelGroup>
        </Panel>

        <ResizeHandle />

        <Panel defaultSize={panelSizes.tree} minSize={12} maxSize={25}>
          <section className="h-full">
            <header className="border-b border-stone-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Repo Tree
            </header>
            {tree}
          </section>
        </Panel>
      </PanelGroup>
    </div>
  );
}
