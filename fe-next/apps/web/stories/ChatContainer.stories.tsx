import type { Meta, StoryObj } from '@storybook/nextjs';
import { ChatContainer } from '@/components/ChatContainer';
import { Provider } from 'jotai';
import { messagesAtom } from '@/store/chat-atoms';
import React from 'react';

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
    (Story) => {
      // Unfortunately jotai atoms are hard to hydrate via props in this setup
      // without additional utilities, but standard Provider will show empty state
      return (
        <Provider>
          <div className="h-screen w-full">
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};
