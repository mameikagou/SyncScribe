import { deepseek } from '@/lib/ai';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: deepseek.chat('deepseek-chat'),
    messages,
    system:
      'You are a helpful assistant. If the user asks for a chart, call the generate_chart tool.',
    tools: {
      generate_chart: tool({
        description: 'Generates a financial growth trend chart',
        inputSchema: z.object({
          reasoning: z.string().describe('The reasoning behind the chart data'),
        }),
        execute: async () => {
          // Simulate data lookup/processing
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return {
            data: [
              { value: 10, time: 1642425322 },
              { value: 25, time: 1642511722 },
              { value: 45, time: 1642598122 },
              { value: 80, time: 1642684522 },
              { value: 150, time: 1642770922 },
              { value: 30, time: 1642857322 },
              { value: 60, time: 1642943722 },
              { value: 90, time: 1643030122 },
            ],
          };
        },
      }),
    },
  });

  return result;
}
