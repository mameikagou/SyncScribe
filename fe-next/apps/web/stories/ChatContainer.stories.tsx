import type { Meta, StoryObj } from '@storybook/nextjs';
import { ChatContainer } from '@/components/ChatContainer';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { messagesAtom, Message } from '@/store/chat-atoms';
import React from 'react';

const HydrateAtoms = ({
  initialValues,
  children,
}: {
  initialValues: [[typeof messagesAtom, Message[]]];
  children: React.ReactNode;
}) => {
  useHydrateAtoms(initialValues);
  return <>{children}</>;
};

const mockMessages: Message[] = [
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

const meta: Meta<typeof ChatContainer> = {
  title: 'Components/ChatContainer',
  component: ChatContainer,
  decorators: [
    (Story) => (
      <Provider>
        <div className="h-screen w-full">
          <Story />
        </div>
      </Provider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ChatContainer>;

export const Default: Story = {
  render: () => <ChatContainer />,
};

export const WithMessages: Story = {
  decorators: [
    (Story) => (
      <Provider>
        <HydrateAtoms initialValues={[[messagesAtom, mockMessages]]}>
          <div className="h-screen w-full">
            <Story />
          </div>
        </HydrateAtoms>
      </Provider>
    ),
  ],
};
