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

const SYSTEM_PROMPT =
  '你是一个意图分拣员。根据用户输入，仅返回以下标签之一：[STOCK_QUERY, REPORT_ANALYZE, CHAT]。不要解释，只返回标签。无法确定时返回 CHAT。输出必须是全大写、无标点、无前后缀。';

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

const labelColors: Record<IntentLabel, string> = {
  STOCK_QUERY: '#22d3ee',
  REPORT_ANALYZE: '#a78bfa',
  CHAT: '#94a3b8',
};

const cardStyle: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(15,23,42,0.75), rgba(30,41,59,0.9))',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: '16px',
  padding: '16px',
  boxShadow: '0 20px 80px rgba(0,0,0,0.35)',
};

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  background: 'rgba(148, 163, 184, 0.08)',
  fontSize: '12px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
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
        background: 'radial-gradient(circle at 10% 10%, rgba(34,211,238,0.12), transparent 26%), #0b1220',
        color: '#e2e8f0',
        padding: '32px 24px 60px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '13px', opacity: 0.65, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Agent Router · Semantic Classification
          </div>
          <div style={{ fontSize: '30px', fontWeight: 700, marginTop: '6px' }}>LLM + 规则的意图路由</div>
          <div style={{ fontSize: '14px', opacity: 0.75, marginTop: '4px' }}>
            极短 System Prompt + LLM 分类，失败自动回退规则，输出只保留标签，便于工业化编排。
          </div>
        </div>
        <div style={{ ...badgeStyle }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22d3ee' }} />
          ready for wiring
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        <div style={{ ...cardStyle, minHeight: '360px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>输入 & 分类</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => handleClassify()}
                disabled={isLoading}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(34,211,238,0.4)',
                  background: isLoading ? 'rgba(34,211,238,0.12)' : 'rgba(34,211,238,0.18)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 600,
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
                  border: '1px solid rgba(148,163,184,0.3)',
                  background: 'rgba(148,163,184,0.1)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 600,
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
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'rgba(15, 23, 42, 0.7)',
              color: '#e2e8f0',
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
                disabled={isLoading}
                style={{
                  borderRadius: '12px',
                  padding: '10px 12px',
                  border: `1px solid ${labelColors[item.label]}55`,
                  background: 'rgba(148, 163, 184, 0.08)',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  minWidth: '180px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '11px', opacity: 0.7, letterSpacing: '0.05em' }}>{item.label}</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>{item.text}</div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '14px', fontSize: '13px', opacity: 0.78 }}>
            {latency ? `延迟: ${latency} ms` : '等待推理…'}
            {error && <span style={{ marginLeft: 12, color: '#f87171' }}>错误: {error}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ ...cardStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontWeight: 600 }}>路由结果</div>
              {result && (
                <div style={{ ...badgeStyle, borderColor: `${labelColors[result.label]}66`, color: labelColors[result.label] }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: labelColors[result.label],
                      boxShadow: `0 0 0 6px ${labelColors[result.label]}22`,
                    }}
                  />
                  {result.label}
                </div>
              )}
            </div>
            {result ? (
              <>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  来源：{result.source === 'llm' ? 'LLM 分类' : '规则兜底'}
                  {result.raw ? ` · 原始输出: ${result.raw}` : null}
                </div>
                <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(148,163,184,0.08)' }}>
                  <div style={{ fontSize: '12px', opacity: 0.65, letterSpacing: '0.05em' }}>Routing Plan</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{currentRouting?.title}</div>
                  <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '6px' }}>{currentRouting?.summary}</div>
                  <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '10px', color: labelColors[result.label] }}>
                    下一跳：{currentRouting?.downstream}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '14px', opacity: 0.7 }}>等待输入或点击“智能分类”。</div>
            )}
          </div>

          <div style={{ ...cardStyle }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>System Prompt（可复用）</div>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '12px',
                border: '1px solid rgba(148,163,184,0.2)',
                padding: '12px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              {SYSTEM_PROMPT}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
