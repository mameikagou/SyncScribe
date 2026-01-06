import type { Meta, StoryObj } from '@storybook/nextjs';
import StockLineChart from './StockLineChart';

const meta: Meta<typeof StockLineChart> = {
  title: 'Vibe/Generated Stock Line Chart',
  component: StockLineChart,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          '模拟 vercel generateUI 的产物，使用 vibe 沙箱 + lightweight-charts，数据直接在 story 里硬编码，方便快速预览行情折线图。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StockLineChart>;

const mockStockData = [
  { time: '2025-01-06', price: 152.1 },
  { time: '2025-01-07', price: 154.3 },
  { time: '2025-01-08', price: 151.8 },
  { time: '2025-01-09', price: 156.7 },
  { time: '2025-01-10', price: 161.2 },
  { time: '2025-01-13', price: 165.9 },
  { time: '2025-01-14', price: 168.4 },
  { time: '2025-01-15', price: 167.2 },
  { time: '2025-01-16', price: 170.5 },
  { time: '2025-01-17', price: 174.8 },
];

export const GeneratedLine: Story = {
  render: () => <StockLineChart symbol="NVDA" data={mockStockData} accentColor="#22d3ee" />,
};

export const BearishDrift: Story = {
  render: () => (
    <StockLineChart
      symbol="TSLA"
      accentColor="#fb7185"
      data={[
        { time: '2025-01-06', price: 238.0 },
        { time: '2025-01-07', price: 234.6 },
        { time: '2025-01-08', price: 229.8 },
        { time: '2025-01-09', price: 226.1 },
        { time: '2025-01-10', price: 221.4 },
        { time: '2025-01-13', price: 219.9 },
        { time: '2025-01-14', price: 223.2 },
        { time: '2025-01-15', price: 217.3 },
        { time: '2025-01-16', price: 214.8 },
        { time: '2025-01-17', price: 212.1 },
      ]}
    />
  ),
};
