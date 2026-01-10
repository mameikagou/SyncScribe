'use client';

import { useChat } from '@ai-sdk/react';
import { JSX, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { TextStreamChatTransport } from 'ai';

export type SlideData = {
  layout: string;
  content: string;
  raw: string;
};

// 架构要点：按三横杠拆页，读取 layout，再把正文交给布局组件
export function parseSlides(completion: string): SlideData[] {
  const normalized = completion?.trim();
  if (!normalized) return [];
  const hydrated = normalized.startsWith('---') ? normalized : `---\n${normalized}`;

  const pages = hydrated
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
        style={{ display: 'grid', gap: 4, paddingLeft: 18, margin: 0, color: '#1c1917' }}
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
          style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1c1917' }}
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
          style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#1c1917' }}
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
          style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: '#1c1917' }}
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
            borderLeft: '3px solid #eab308',
            background: '#fff7ed',
            color: '#1c1917',
            borderRadius: 8,
          }}
        >
          {trimmed.replace(/^>\s+/, '')}
        </blockquote>
      );
      return;
    }

    elements.push(
      <p key={`p-${key++}`} style={{ margin: '0 0 8px', lineHeight: 1.5, color: '#1c1917' }}>
        {trimmed}
      </p>
    );
  });

  flushList();

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{elements}</div>;
};

const CoverLayout = ({ content }: { content: string }) => {
  const [rawTitle, ...rest] = content.split('\n').filter(Boolean);
  const title = rawTitle ?? '';
  const subtitle = rest.join('\n').trim();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '48px',
        background: 'linear-gradient(135deg, #f8fafc, #e5e7eb)',
        color: '#1c1917',
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
            opacity: 0.85,
            textTransform: 'uppercase',
          }}
        >
          AI · Slidev Style
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            marginTop: 8,
            lineHeight: 1.1,
            fontFamily: 'Source Serif 4, serif',
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              marginTop: 14,
              color: '#1f2937',
              maxWidth: 720,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
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
          background: '#ffffff',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #e5e7eb',
          overflow: 'auto',
        }}
      >
        <SimpleMarkdown content={(left ?? '').trim()} />
      </div>
      <div
        style={{
          background: '#f8fafc',
          borderRadius: 12,
          padding: 16,
          border: '1px dashed rgba(148,163,184,0.5)',
          overflow: 'auto',
        }}
      >
        <SimpleMarkdown content={(right ?? '').trim()} />
      </div>
    </div>
  );
};

const DefaultLayout = ({ content }: { content: string }) => (
  <div style={{ padding: '38px 40px', background: '#ffffff', height: '100%' }}>
    <SimpleMarkdown content={content} />
  </div>
);

const SlideRenderer = ({ slide }: { slide: SlideData }) => {
  const previewHostRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const BASE_WIDTH = 960;
  const BASE_HEIGHT = 540;

  useEffect(() => {
    const el = previewHostRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? BASE_WIDTH;
      const nextScale = Math.min(width / BASE_WIDTH, 1.25);
      setScale(nextScale);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const layouts: Record<string, ({ content }: { content: string }) => JSX.Element> = {
    cover: CoverLayout,
    'two-cols': TwoColsLayout,
    default: DefaultLayout,
  };

  const SelectedLayout = layouts[slide.layout] ?? layouts.default;

  return (
    <div
      ref={previewHostRef}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '6px 0',
      }}
    >
      <div
        className="aspect-video"
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(148,163,184,0.45)',
          boxShadow: '0 16px 48px rgba(28,25,23,0.18)',
          background: '#ffffff',
        }}
      >
        <SelectedLayout content={slide.content} />
      </div>
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
              ? '1px solid rgba(16,185,129,0.7)'
              : '1px solid rgba(148,163,184,0.6)',
          background: idx === activeIndex ? 'rgba(16,185,129,0.14)' : '#f8f8f7',
          color: '#1c1917',
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
  `---
- 每一页用三条横杠切割
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

const SAMPLE_FULL = SAMPLE_STREAM.join('');

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
    transport: new TextStreamChatTransport({ api: '/api/vibe/slidev' }),
    onError: (err) => {
      setAiError(err.message ?? 'unknown error');
    },
  });

  const getMessageText = (m: any) => {
    if (typeof m?.content === 'string') return m.content;
    if (Array.isArray(m?.content)) {
      return (
        m.content
          ?.filter((p: any) => p?.type === 'text' && p?.text)
          .map((p: any) => p.text)
          .join('') ?? ''
      );
    }
    return (
      m?.parts
        ?.filter((p: any) => p?.type === 'text' && p?.text)
        .map((p: any) => p.text)
        .join('') ?? ''
    );
  };

  const aiCompletion = useMemo(() => {
    const lastAssistant = [...aiMessages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return '';
    return getMessageText(lastAssistant);
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
      setCompletion((prev) =>
        prev
          ? `${prev}
${chunk}`
          : chunk
      );
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
    setCompletion((prev) =>
      prev
        ? `${prev}
${chunk}`
        : chunk
    );
  };

  const triggerAiStream = async () => {
    setMode('ai');
    stopStream();
    setCompletion('');
    setAiError(null);
    try {
      await sendAiMessage({
        role: 'user',
        content: [{ type: 'text', text: aiTopic }],
      });
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
        background: '#f0f0ef',
        color: '#1c1917',
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
              opacity: 0.7,
              textTransform: 'uppercase',
            }}
          >
            Vibe / Slidev Style MVP
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              marginTop: 6,
              fontFamily: 'Source Serif 4, serif',
            }}
          >
            流式 Markdown → 即时 PPT
          </div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 6, maxWidth: 720 }}>
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
              borderRadius: 10,
              border: '1px solid #10b981',
              background: streaming ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.18)',
              color: '#0f172a',
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
              borderRadius: 10,
              border: '1px solid #d6d3d1',
              background: '#ffffff',
              color: '#1c1917',
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
                border: '1px solid #d6d3d1',
                background: '#ffffff',
                color: '#1c1917',
                minWidth: 220,
              }}
            />
            <button
              type="submit"
              disabled={aiLoading}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid #10b981',
                background: aiLoading ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.18)',
                color: '#0f172a',
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
              borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.5)',
              background: 'rgba(239,68,68,0.12)',
              color: '#991b1b',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(380px, 0.95fr) minmax(780px, 1.5fr)',
          gap: 16,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 540,
            boxShadow: '0 12px 30px rgba(28,25,23,0.08)',
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
                border: '1px solid rgba(16,185,129,0.4)',
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
              background: '#ffffff',
              color: '#1c1917',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
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
                background: '#ffffff',
                color: '#1c1917',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
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
                  border: '1px solid #0ea5e9',
                  background: 'rgba(14,165,233,0.12)',
                  color: '#0f172a',
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
                  border: '1px solid #d6d3d1',
                  background: '#f8f8f7',
                  color: '#1c1917',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                重置示例
              </button>
            </div>
            {aiError ? (
              <div style={{ color: '#b91c1c', fontSize: 12 }}>
                AI 请求失败：{aiError}（确保 /api/vibe/slidev 可用且 API Key 已配置）
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 12px 30px rgba(28,25,23,0.08)',
            minHeight: 620,
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
              alignItems: 'center',
              padding: '12px 0 4px',
              width: '100%',
            }}
          >
            {currentSlide ? (
              <SlideRenderer slide={currentSlide} />
            ) : (
              <div
                style={{
                  width: '100%',
                  maxWidth: 1240,
                  aspectRatio: '16 / 9',
                  borderRadius: 16,
                  border: '1px dashed rgba(148,163,184,0.6)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#475569',
                  fontWeight: 600,
                }}
              >
                等待第一块流式内容...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
