import type { Meta, StoryObj } from '@storybook/nextjs';
import AgentRouterPanel from '../../app/(desk)/vibe/agent-router/AgentRouterPanel';

const meta: Meta<typeof AgentRouterPanel> = {
  title: 'Vibe/Agent Router',
  component: AgentRouterPanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          '语义路由示例：极短 System Prompt + LLM 分类 + 规则兜底，展示输入、结果和下游路由计划，可直接复用到生产流水线。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AgentRouterPanel>;

export const Default: Story = {
  render: () => <AgentRouterPanel apiBase="http://localhost:3000" />,
};
