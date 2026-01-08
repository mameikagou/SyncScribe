'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import AreaChart from '@/components/AreaChart';
import { Bot, User } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DefaultChatTransport } from 'ai';

export default function ChartDemoPage() {
  const [inputValue, setInputValue] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/gen-chart',
    }),
    onError: (err: Error) => {
      console.error('AI SDK Error:', err);
    },
  });

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const messagePayload = {
        id: uuidv4(),
        role: 'user',
        parts: [{ type: 'text', text: inputValue }],
        createdAt: new Date(),
      };

      setInputValue('');
      // @ts-ignore
      await sendMessage(messagePayload);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Helper to extract text from v5 parts
  const getMessageContent = (m: any) => {
    if (m.content) return m.content;
    return (
      m.parts
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('') || ''
    );
  };

  return (
    <div className="min-h-screen bg-desk p-8 flex flex-col gap-8">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-[80vh]">
        <header className="mb-8 flex-none">
          <h1 className="text-3xl font-serif text-ink mb-2">GenUI Service Demo (v5)</h1>
          <p className="text-ink-muted">
            Ask for a chart (e.g., "Show me the growth trend") to see Server-Driven UI via Tools.
          </p>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-6 p-4 rounded-lg bg-white/50 border border-ink-faint">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded center flex items-center justify-center shrink-0 
                ${m.role === 'user' ? 'bg-ink text-paper' : 'bg-action text-white'}`}
              >
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className={`max-w-[80%] space-y-4`}>
                {/* Text Content */}
                {getMessageContent(m) && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      m.role === 'user'
                        ? 'bg-ink-faint text-ink'
                        : 'bg-paper border border-ink-faint shadow-sm'
                    }`}
                  >
                    {getMessageContent(m)}
                  </div>
                )}

                {/* Tool Invocations (GenUI) */}
                {m.toolInvocations?.map((toolInvocation: any) => {
                  const toolCallId = toolInvocation.toolCallId;

                  if (toolInvocation.toolName === 'generate_chart') {
                    // 1. Rendering 'Thinking' state or Final Result
                    if (!('result' in toolInvocation)) {
                      return (
                        <div
                          key={toolCallId}
                          className="p-4 bg-paper border border-ink-faint rounded-lg animate-pulse text-xs text-ink-muted"
                        >
                          Generating Chart...
                        </div>
                      );
                    }

                    // 2. Render Final Component
                    return (
                      <div
                        key={toolCallId}
                        className="w-full max-w-[600px] h-[350px] bg-paper border border-ink-faint rounded-xl shadow-crystal p-4"
                      >
                        <h4 className="font-serif text-ink mb-4">Generated Growth Chart</h4>
                        {/* Ensure container references for lightweight-charts */}
                        <div className="w-full h-[280px]">
                          <AreaChart data={toolInvocation.result.data} />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center text-ink-muted text-sm py-12">
              Try asking: "Analyze the Q1 growth data"
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="flex gap-2 flex-none">
          <input
            className="flex-1 p-3 rounded-lg border border-ink-faint bg-paper focus:outline-none focus:ring-2 focus:ring-action/20 transition-all font-sans text-sm"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type 'Describe the trend'..."
            disabled={status !== 'ready' && status !== 'error'}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-action text-white font-medium rounded-lg hover:bg-action-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={status !== 'ready' && status !== 'error'}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
