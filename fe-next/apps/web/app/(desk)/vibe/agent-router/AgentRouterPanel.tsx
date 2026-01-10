'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

type IntentLabel = 'STOCK_QUERY' | 'REPORT_ANALYZE' | 'CHAT';

export type AgentRouterPanelProps = {
  apiBase?: string;
};

type ClassificationResult = {
  label: IntentLabel;
  raw?: string;
  source?: 'llm' | 'heuristic';
};

const examples: { label: IntentLabel; text: string }[] = [
  { label: 'STOCK_QUERY', text: '茅台最近跌了吗？给我看看股价走势' },
  { label: 'REPORT_ANALYZE', text: '帮我解读一下苹果最新季度财报的亮点和风险' },
  { label: 'CHAT', text: '今天天气不错，给我讲个笑话吧' },
];

const routingPlan: Record<IntentLabel, { title: string; summary: string; downstream: string }> = {
  STOCK_QUERY: {
    title: '行情/交易',
    summary: '走行情通道，调行情或交易前置能力，快速返回列表/图表数据。',
    downstream: '调用 /api/vibe/tushare 或行情聚合服务；需要时拼装图表组件。',
  },
  REPORT_ANALYZE: {
    title: '研报/财报解读',
    summary: '走长文本通道，结合检索 + 结构化摘要返回决策要点。',
    downstream: '触发 RAG/长文本模型，输出结构化要点/红旗/风险提示。',
  },
  CHAT: {
    title: '闲聊/兜底',
    summary: '走低成本通道，短文本回复或兜底提示。',
    downstream: '使用轻量模型或规则回复，维持对话体验。',
  },
};

const labelBadges: Record<IntentLabel, CSSProperties> = {
  STOCK_QUERY: { background: 'rgba(16,185,129,0.12)', color: '#166534', borderColor: 'rgba(16,185,129,0.4)' },
  REPORT_ANALYZE: { background: 'rgba(14,165,233,0.12)', color: '#0c4a6e', borderColor: 'rgba(14,165,233,0.4)' },
  CHAT: { background: 'rgba(202,138,4,0.12)', color: '#92400e', borderColor: 'rgba(202,138,4,0.4)' },
};

export default function AgentRouterPanel({ apiBase }: AgentRouterPanelProps) {
  const [input, setInput] = useState<string>(examples[0]?.text ?? '');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentRouting = useMemo(() => (result ? routingPlan[result.label] : null), [result]);
  const endpoint = useMemo(
    () => (apiBase ? `${apiBase.replace(/\/$/, '')}/api/vibe/agent-router` : '/api/vibe/agent-router'),
    [apiBase],
  );

  const handleClassify = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query) return;
    setIsLoading(true);
    setError(null);
    const started = performance.now();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as ClassificationResult;
      setResult(data);
      setLatency(Math.max(1, Math.round(performance.now() - started)));
    } catch (e: any) {
      setError(e?.message ?? '请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f0ef',
        color: '#1c1917',
        padding: '32px 24px 60px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '13px', opacity: 0.7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Agent Router · Semantic Classification
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '6px', fontFamily: 'Source Serif 4, serif' }}>
            LLM + 规则的意图路由
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px', maxWidth: 720 }}>
            极短 System Prompt + LLM 分类，失败自动回退规则，输出只保留标签，便于工业化编排。
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '999px',
            border: '1px solid #d6d3d1',
            background: '#ffffff',
            fontSize: '12px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 10px rgba(28,25,23,0.06)',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
          ready for wiring
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 12px 30px rgba(28,25,23,0.08)',
            minHeight: '360px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>输入 & 分类</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => handleClassify()}
                disabled={isLoading}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #10b981',
                  background: isLoading ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.18)',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {isLoading ? '推理中…' : '智能分类'}
              </button>
              <button
                disabled={isLoading}
                onClick={() => {
                  const next = examples[Math.floor(Math.random() * examples.length)];
                  setInput(next.text);
                  handleClassify(next.text);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #d6d3d1',
                  background: '#f8f8f7',
                  color: '#1c1917',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                随机示例
              </button>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入用户话术..."
            rows={5}
            style={{
              width: '100%',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#1c1917',
              padding: '12px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            {examples.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setInput(item.text);
                  handleClassify(item.text);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid #d6d3d1',
                  background: '#ffffff',
                  color: '#1c1917',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {item.text}
              </button>
            ))}
          </div>

          {error ? (
            <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>请求失败：{error}</div>
          ) : null}
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 12px 30px rgba(28,25,23,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>识别结果</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {latency ? `Latency: ${latency}ms` : '等待输入'}
              </div>
            </div>
            {result ? (
              <div
                style={{
                  ...labelBadges[result.label],
                  borderWidth: 1,
                  borderStyle: 'solid',
                  padding: '8px 12px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: 'uppercase',
                }}
              >
                {result.label}
              </div>
            ) : null}
          </div>

          <div
            style={{
              background: '#f8f8f7',
              border: '1px dashed #d6d3d1',
              borderRadius: 10,
              padding: 12,
              minHeight: 120,
              display: 'grid',
              alignContent: 'start',
              gap: 6,
              color: '#1c1917',
            }}
          >
            {result ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{routingPlan[result.label].title}</div>
                <div style={{ fontSize: 13, color: '#44403c' }}>{routingPlan[result.label].summary}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{routingPlan[result.label].downstream}</div>
              </>
            ) : (
              <div style={{ color: '#6b7280', fontSize: 13 }}>还没有结果，输入一句话试试。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
