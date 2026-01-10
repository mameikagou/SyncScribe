'use client';

import AreaChart from '@/components/AreaChart';
import AgentRouterPanel from '@/app/(desk)/vibe/agent-router/AgentRouterPanel';
import DeckOutlineDemo from '@/app/(desk)/vibe/ppt-outline/DeckOutlineDemo';
import SlidevMvp from '@/app/(desk)/vibe/slidev/SlidevMvp';
import { ChatContainer } from '@/components/ChatContainer';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { messagesAtom, type Message } from '@/store/chat-atoms';
import type { ComponentType, ReactNode } from 'react';

type RegistryItem = {
  label: string;
  component: ComponentType<any>;
  props?: Record<string, any>;
  description?: string;
};

// 从旧 stories 抽取的 mock
const areaChartMock = {
  data: [
    { value: 0, time: 1642425322 },
    { value: 8, time: 1642511722 },
    { value: 10, time: 1642598122 },
    { value: 20, time: 1642684522 },
    { value: 3, time: 1642770922 },
    { value: 43, time: 1642857322 },
    { value: 41, time: 1642943722 },
    { value: 43, time: 1643030122 },
    { value: 56, time: 1643116522 },
    { value: 46, time: 1643202922 },
  ],
};

const chatMockMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Explain Quantum Computing like I am 5.',
    createdAt: Date.now(),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Imagine you have a magical coin that can be heads and tails at the same time...',
    concepts: [
      { title: 'Superposition', description: 'Being in multiple states at once' },
      { title: 'Entanglement', description: 'Spooky action at a distance' },
    ],
    createdAt: Date.now() + 1000,
  },
];

function ChatContainerWithMock() {
  return (
    <Provider>
      <HydrateMessages initialValues={[[messagesAtom, chatMockMessages]]}>
        <div className="h-full w-full">
          <ChatContainer />
        </div>
      </HydrateMessages>
    </Provider>
  );
}

function HydrateMessages({
  initialValues,
  children,
}: {
  initialValues: [[typeof messagesAtom, Message[]]];
  children: ReactNode;
}) {
  useHydrateAtoms(initialValues);
  return <>{children}</>;
}

export const COMPONENT_REGISTRY: Record<string, RegistryItem> = {
  AreaChart: {
    label: 'AreaChart',
    component: AreaChart,
    props: areaChartMock,
    description: '基于 lightweight-charts 的面积图，内置 mock 数据',
  },
  ChatContainer: {
    label: 'ChatContainer (with mock messages)',
    component: ChatContainerWithMock,
    description: '注入 jotai Provider + mock 消息，复用 chat-atoms 状态',
  },
  AgentRouterPanel: {
    label: 'Agent Router',
    component: AgentRouterPanel,
    props: { apiBase: 'http://localhost:3000' },
    description: '意图分类面板，使用 vibe 路由示例',
  },
  SlidevMvp: {
    label: 'Slidev Streaming MVP',
    component: SlidevMvp,
    description: '流式 Markdown → 幻灯片的 vibe MVP，无需额外 props',
  },
  DeckOutlineDemo: {
    label: 'Deck Outline (JSON → Cards)',
    component: DeckOutlineDemo,
    description: '结构化 PPT JSON 解析、卡片渲染与模板锁定的 vibe demo',
  },
};
