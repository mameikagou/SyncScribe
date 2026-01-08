'use client';

import { useChat } from '@ai-sdk/react';
import { JSX, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DefaultChatTransport } from 'ai';
export type SlideData = {
  layout: string;
  content: string;
  raw: string;
};

// 架构要点：按三横杠拆页，读取 layout，再把正文交给布局组件
export function parseSlides(completion: string): SlideData[] {
  const pages = completion
    .split('---')
    .map((page) => page.trim())
    .filter(Boolean);

  return pages.map((page) => {
    const layoutMatch = page.match(/layout:\s*([\w-]+)/i);
    const layout = layoutMatch ? layoutMatch[1] : 'default';
    const content = page.replace(/layout:\s*([\w-]+)/i, '').trim();
    return { layout, content, raw: page };
  });
}

type MarkdownProps = {
  content: string;
};

const SimpleMarkdown = ({ content }: MarkdownProps) => {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  const listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!listBuffer.length) return;
    elements.push(
      <ul
        key={`list-${key++}`}
        style={{ display: 'grid', gap: 4, paddingLeft: 18, margin: 0, color: '#0f172a' }}
      >
        {listBuffer.map((item, idx) => (
          <li key={idx} style={{ lineHeight: 1.4 }}>
            {item}
          </li>
        ))}
      </ul>
    );
    listBuffer.length = 0;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }

    flushList();

    if (/^###\s+/.test(trimmed)) {
      elements.push(
        <h3
          key={`h3-${key++}`}
          style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}
        >
          {trimmed.replace(/^###\s+/, '')}
        </h3>
      );
      return;
    }

    if (/^##\s+/.test(trimmed)) {
      elements.push(
        <h2
          key={`h2-${key++}`}
          style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}
        >
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      );
      return;
    }

    if (/^#\s+/.test(trimmed)) {
      elements.push(
        <h1
          key={`h1-${key++}`}
          style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}
        >
          {trimmed.replace(/^#\s+/, '')}
        </h1>
      );
      return;
    }

    if (/^>\s+/.test(trimmed)) {
      elements.push(
        <blockquote
          key={`quote-${key++}`}
          style={{
            margin: '0 0 8px',
            padding: '8px 12px',
            borderLeft: '3px solid #c084fc',
            background: '#f4f3ff',
            color: '#0f172a',
            borderRadius: 8,
          }}
        >
          {trimmed.replace(/^>\s+/, '')}
        </blockquote>
      );
      return;
    }

    elements.push(
      <p key={`p-${key++}`} style={{ margin: '0 0 8px', lineHeight: 1.5, color: '#0f172a' }}>
        {trimmed}
      </p>
    );
  });

  flushList();

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{elements}</div>;
};

const CoverLayout = ({ content }: { content: string }) => {
  const [title, ...rest] = content.split('\n');
  const subtitle = rest.join('\n').trim();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '48px',
        background: 'linear-gradient(140deg, #0ea5e9, #6366f1, #a855f7)',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ maxWidth: 680 }}>
        <div
          style={{
            fontSize: 14,
            letterSpacing: '0.08em',
            opacity: 0.9,
            textTransform: 'uppercase',
          }}
        >
          AI · Slidev Style
        </div>
        <div style={{ fontSize: 46, fontWeight: 800, marginTop: 8, lineHeight: 1.05 }}>{title}</div>
        {subtitle ? (
          <div
            style={{ fontSize: 18, lineHeight: 1.6, marginTop: 14, color: 'rgba(226,232,240,0.9)' }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22d3ee' }} />
        <div style={{ fontWeight: 600, fontSize: 14 }}>流式 Markdown → 幻灯片</div>
      </div>
    </div>
  );
};

const TwoColsLayout = ({ content }: { content: string }) => {
  const [left, right] = content.split('::right::');
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 18,
        padding: '32px 36px',
        height: '100%',
      }}
    >
      <div
        style={{
          background: '#f8fafc',
          borderRadius: 12,
          padding: 16,
          boxShadow: 'inset 0 1px 0 rgba(15,23,42,0.08)',
          overflow: 'auto',
        }}
      >
        <SimpleMarkdown content={(left ?? '').trim()} />
      </div>
      <div
        style={{
          background: '#eef2ff',
          borderRadius: 12,
          padding: 16,
          border: '1px dashed rgba(99,102,241,0.4)',
          overflow: 'auto',
        }}
      >
        <SimpleMarkdown content={(right ?? '').trim()} />
      </div>
    </div>
  );
};

const DefaultLayout = ({ content }: { content: string }) => (
  <div style={{ padding: '38px 40px', background: '#f8fafc', height: '100%' }}>
    <SimpleMarkdown content={content} />
  </div>
);

const SlideRenderer = ({ slide }: { slide: SlideData }) => {
  const layouts: Record<string, ({ content }: { content: string }) => JSX.Element> = {
    cover: CoverLayout,
    'two-cols': TwoColsLayout,
    default: DefaultLayout,
  };

  const SelectedLayout = layouts[slide.layout] ?? layouts.default;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1080,
        aspectRatio: '16 / 9',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(148,163,184,0.35)',
        boxShadow: '0 30px 80px rgba(15,23,42,0.35)',
        background: '#0f172a',
      }}
    >
      <SelectedLayout content={slide.content} />
    </div>
  );
};

type SlideMiniMapProps = {
  slides: SlideData[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

const SlideMiniMap = ({ slides, activeIndex, onSelect }: SlideMiniMapProps) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {slides.map((slide, idx) => (
      <button
        key={`${slide.layout}-${idx}`}
        onClick={() => onSelect(idx)}
        style={{
          border:
            idx === activeIndex
              ? '1px solid rgba(56,189,248,0.8)'
              : '1px solid rgba(148,163,184,0.35)',
          background: idx === activeIndex ? 'rgba(14,165,233,0.12)' : 'rgba(148,163,184,0.12)',
          color: '#e2e8f0',
          padding: '8px 10px',
          borderRadius: 12,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        #{idx + 1} · {slide.layout}
      </button>
    ))}
  </div>
);

const SAMPLE_STREAM: string[] = [
  `---
layout: cover
# AI 驱动的市场快报
> 流式 Markdown → 幻灯片，实时盯盘/研报的最小闭环`,
  `- 每一页用三条横杠切割
- layout: cover | two-cols | default
- 右侧展示当前正在写的幻灯片`,
  `---
layout: two-cols
## 左列：要点摘要
- 行情脉络：上午冲高，午后回落，北向小幅净流入
- 风险雷达：地产链、消费链情绪偏弱
- 下一步：补充行业对比与换手节奏
::right::
## 右列：动态图 Hook
- <stockchart symbol="000001.SZ" />
- <signal-chip type="risk" />
- 把流式输出接成组件即可`,
  `---
layout: default
## 打磨计划
- 接入真实的 SSE 流
- 补更多 layout 组件库
- 在 storybook 里直接撸样式，不碰主业务`,
];

const SAMPLE_FULL = SAMPLE_STREAM.join('\n');

export default function SlidevMvp() {
  const [completion, setCompletion] = useState<string>(SAMPLE_STREAM[0]);
  const [manualDraft, setManualDraft] = useState<string>(SAMPLE_FULL);
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<'demo' | 'ai'>('demo');
  const [activeIndex, setActiveIndex] = useState(0);
  const streamStepRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [aiTopic, setAiTopic] = useState('AI 投研快报');
  const [aiError, setAiError] = useState<string | null>(null);
  const {
    messages: aiMessages,
    sendMessage: sendAiMessage,
    status: aiStatus,
    stop: stopAi,
  } = useChat({
    transport: new DefaultChatTransport({ api: '/api/vibe/slidev' }),
    onError: (err) => {
      setAiError(err.message ?? 'unknown error');
    },
  });

  const aiCompletion = useMemo(() => {
    const lastAssistant = [...aiMessages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return '';
    const text =
      lastAssistant.parts?.map((p: any) => (p.type === 'text' ? p.text : '')).join('') ?? '';
    return text;
  }, [aiMessages]);
  const aiLoading = aiStatus === 'submitted' || aiStatus === 'streaming';

  const slides = useMemo(() => parseSlides(completion), [completion]);
  const currentSlide = slides[activeIndex] ?? slides[slides.length - 1];

  const stopStream = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStreaming(false);
  };

  const startStream = () => {
    setMode('demo');
    stopStream();
    setCompletion('');
    setActiveIndex(0);
    setStreaming(true);
    streamStepRef.current = 0;

    timerRef.current = setInterval(() => {
      const chunk = SAMPLE_STREAM[streamStepRef.current];
      if (chunk === undefined) {
        stopStream();
        return;
      }
      streamStepRef.current += 1;
      setCompletion((prev) => (prev ? `${prev}\n${chunk}` : chunk));
    }, 900);
  };

  const appendSingleChunk = () => {
    setMode('demo');
    const chunk = SAMPLE_STREAM[streamStepRef.current];
    if (chunk === undefined) {
      stopStream();
      return;
    }
    streamStepRef.current += 1;
    setCompletion((prev) => (prev ? `${prev}\n${chunk}` : chunk));
  };

  const triggerAiStream = async () => {
    setMode('ai');
    stopStream();
    setCompletion('');
    setAiError(null);
    try {
      await sendAiMessage({ text: aiTopic });
    } catch (err: any) {
      setAiError(err?.message ?? 'AI 请求失败');
    }
  };

  useEffect(() => {
    if (!slides.length) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex(slides.length - 1);
  }, [slides.length]);

  useEffect(
    () => () => {
      stopStream();
      stopAi?.();
    },
    []
  );

  useEffect(() => {
    if (mode !== 'ai') return;
    setCompletion(aiCompletion);
  }, [aiCompletion, mode]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 20% 20%, rgba(34,211,238,0.14), transparent 32%), #0b1220',
        color: '#e2e8f0',
        padding: '32px 26px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              letterSpacing: '0.08em',
              opacity: 0.72,
              textTransform: 'uppercase',
            }}
          >
            Vibe / Slidev Style MVP
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>
            流式 Markdown → 即时 PPT
          </div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 6 }}>
            左侧观测原始 stream，右侧实时渲染最新一页；三横杠切页，layout 定义模板，符合 slidev
            习惯。
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={startStream}
            disabled={streaming}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid rgba(56,189,248,0.6)',
              background: streaming ? 'rgba(56,189,248,0.12)' : 'rgba(56,189,248,0.2)',
              color: '#e2e8f0',
              fontWeight: 700,
              cursor: streaming ? 'not-allowed' : 'pointer',
            }}
          >
            {streaming ? '流式中...' : '重置并流式推送'}
          </button>
          <button
            onClick={appendSingleChunk}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.45)',
              background: 'rgba(148,163,184,0.16)',
              color: '#e2e8f0',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            手动追加一块
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              triggerAiStream();
            }}
            style={{ display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="输入主题，走 AI 实流"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(148,163,184,0.3)',
                background: 'rgba(15,23,42,0.7)',
                color: '#e2e8f0',
                minWidth: 220,
              }}
            />
            <button
              type="submit"
              disabled={aiLoading}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(16,185,129,0.6)',
                background: aiLoading ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.18)',
                color: '#e2e8f0',
                fontWeight: 700,
                cursor: aiLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {aiLoading ? 'AI 推理中...' : 'AI 流式生成'}
            </button>
          </form>
          <button
            onClick={() => {
              stopStream();
              setMode('demo');
              setCompletion('');
              streamStepRef.current = 0;
              stopAi?.();
            }}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(239,68,68,0.5)',
              background: 'rgba(239,68,68,0.1)',
              color: '#fecdd3',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 16 }}>
        <div
          style={{
            background: 'linear-gradient(140deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
            borderRadius: 16,
            border: '1px solid rgba(148,163,184,0.2)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 540,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Raw Stream</div>
              <div style={{ fontSize: 12, opacity: 0.72 }}>监听 AI 输出，三横杠分片</div>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 10,
                border: '1px solid rgba(52,211,153,0.5)',
                background: 'rgba(16,185,129,0.08)',
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: streaming || aiLoading ? '#22c55e' : '#94a3b8',
                }}
              />
              {mode === 'ai'
                ? aiLoading
                  ? 'AI 流式进行中'
                  : 'AI 结果已解析'
                : streaming
                  ? '本地示例流中'
                  : '手动/模拟'}
            </div>
          </div>

          <textarea
            readOnly
            value={completion}
            placeholder="AI 的流式 Markdown 将出现在这里..."
            style={{
              width: '100%',
              minHeight: 320,
              background: '#0f172a',
              color: '#e2e8f0',
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.25)',
              padding: 12,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 13,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, opacity: 0.8 }}>自定义输入（会覆盖当前 stream）</div>
            <textarea
              value={manualDraft}
              onChange={(e) => setManualDraft(e.target.value)}
              rows={6}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                color: '#e2e8f0',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.35)',
                padding: 12,
                fontSize: 13,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
              placeholder="粘贴你自己的 slidev 风格 Markdown..."
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  stopStream();
                  setMode('demo');
                  setCompletion(manualDraft);
                  stopAi?.();
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(59,130,246,0.6)',
                  background: 'rgba(59,130,246,0.12)',
                  color: '#e2e8f0',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                应用到预览
              </button>
              <button
                onClick={() => {
                  setMode('demo');
                  setManualDraft(SAMPLE_FULL);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.35)',
                  background: 'rgba(148,163,184,0.14)',
                  color: '#e2e8f0',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                重置示例
              </button>
            </div>
            {aiError ? (
              <div style={{ color: '#fca5a5', fontSize: 12 }}>
                AI 请求失败：{aiError}（确保 /api/vibe/slidev 可用且 API Key 已配置）
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(160deg, rgba(30,41,59,0.9), rgba(12,18,34,0.95))',
            borderRadius: 16,
            border: '1px solid rgba(148,163,184,0.2)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>实时预览</div>
              <div style={{ fontSize: 12, opacity: 0.72 }}>
                解析 {slides.length} 页，当前展示{' '}
                {currentSlide ? `${activeIndex + 1}/${slides.length}` : '0/0'}
              </div>
            </div>
            <SlideMiniMap
              slides={slides}
              activeIndex={activeIndex}
              onSelect={(idx) => setActiveIndex(idx)}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              placeItems: 'center',
              padding: '8px 0',
            }}
          >
            {currentSlide ? (
              <SlideRenderer slide={currentSlide} />
            ) : (
              <div
                style={{
                  width: '100%',
                  maxWidth: 1080,
                  aspectRatio: '16 / 9',
                  borderRadius: 16,
                  border: '1px dashed rgba(148,163,184,0.35)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#94a3b8',
                  fontWeight: 600,
                }}
              >
                等待第一块流式内容...
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
              gap: 12,
            }}
          >
            <div
              style={{
                borderRadius: 12,
                border: '1px solid rgba(56,189,248,0.4)',
                background: 'rgba(56,189,248,0.08)',
                padding: 12,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>The Contract</div>
              <div>layout + content + raw，保证解析与组件解耦。</div>
            </div>
            <div
              style={{
                borderRadius: 12,
                border: '1px solid rgba(167,139,250,0.4)',
                background: 'rgba(167,139,250,0.08)',
                padding: 12,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>The Parser</div>
              <div>三横杠切页，YAML 读 layout，剩余 Markdown 直接渲染。</div>
            </div>
            <div
              style={{
                borderRadius: 12,
                border: '1px solid rgba(52,211,153,0.35)',
                background: 'rgba(52,211,153,0.1)',
                padding: 12,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>The Dispatcher</div>
              <div>layout → 对应模板组件，可继续扩充 cover/two-cols/default 之外的变体。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
