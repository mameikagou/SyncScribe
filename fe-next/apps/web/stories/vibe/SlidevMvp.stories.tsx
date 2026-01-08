import type { Meta, StoryObj } from '@storybook/nextjs';
import SlidevMvp from '../../app/(desk)/vibe/slidev/SlidevMvp';

const meta: Meta<typeof SlidevMvp> = {
  title: 'Vibe/Slidev Streaming MVP',
  component: SlidevMvp,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: 'Slidev 风格的流式 Markdown → 幻灯片 MVP，左侧观测原始输出，右侧实时渲染最新一页。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SlidevMvp>;

export const Default: Story = {
  render: () => <SlidevMvp />,
};
