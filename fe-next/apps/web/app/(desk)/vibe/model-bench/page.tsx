'use client';

import { useMemo, useState } from 'react';

import type { RegisteredModel } from '@/lib/ai-models';
import { DEFAULT_MODEL_TEST_PROMPT, REGISTERED_MODELS } from '@/lib/ai-models';

type ModelBenchResult = {
  id: string;
  label: string;
  model: string;
  provider: string;
  ok: boolean;
  text?: string;
  error?: string;
  durationMs: number;
};

type BenchResponse = {
  prompt: string;
  results: ModelBenchResult[];
};

export default function ModelBenchPage() {
  const [prompt, setPrompt] = useState(DEFAULT_MODEL_TEST_PROMPT);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ModelBenchResult[]>([]);

  const modelIndex = useMemo(() => {
    const map = new Map<string, ModelBenchResult>();
    for (const result of results) {
      map.set(result.id, result);
    }
    return map;
  }, [results]);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/api/vibe/model-bench/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || '测试失败');
      }

      const data = (await res.json()) as BenchResponse;
      setResults(data.results ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-desk text-ink px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md px-6 py-6 space-y-4">
          <div className="text-xs uppercase tracking-[0.24em] text-stone-500 font-semibold">Vibe · Model Bench</div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-serif font-semibold">一键模型连测台</h1>
              <p className="text-sm text-stone-500">对所有注册模型执行同一条 prompt，返回回复与耗时。</p>
            </div>
            <button
              className="px-6 py-3 rounded-full bg-action text-white font-semibold shadow-md disabled:opacity-60"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? '正在批量测试...' : '一键测试所有模型'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-stone-500 font-semibold">测试 Prompt</label>
            <textarea
              className="w-full min-h-[96px] rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action/40"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </header>

        <section className="grid lg:grid-cols-[0.9fr,1.1fr] gap-6">
          <div className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">模型列表</h2>
            <div className="space-y-3">
              {REGISTERED_MODELS.map((model) => {
                const result = modelIndex.get(model.id);
                const status = result
                  ? result.ok
                    ? 'success'
                    : 'error'
                  : isRunning
                    ? 'running'
                    : 'idle';

                return (
                  <ModelRow key={model.id} model={model} status={status} />
                );
              })}
            </div>
          </div>

          <div className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">输出结果</h2>
            <div className="space-y-4">
              {results.length === 0 && (
                <p className="text-sm text-stone-500">
                  暂无结果，点击“一键测试所有模型”开始。
                </p>
              )}
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`rounded-md border px-4 py-3 ${
                    result.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{result.label}</div>
                    <div className="text-xs text-stone-500">{result.durationMs}ms</div>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">{result.model}</div>
                  <div className="mt-2 text-sm whitespace-pre-wrap">
                    {result.ok ? result.text || '（无输出）' : result.error}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ModelRow({
  model,
  status,
}: {
  model: RegisteredModel;
  status: 'idle' | 'running' | 'success' | 'error';
}) {
  const statusMap: Record<typeof status, { label: string; color: string }> = {
    idle: { label: '待测试', color: 'bg-stone-200 text-stone-600' },
    running: { label: '测试中', color: 'bg-amber-200 text-amber-800' },
    success: { label: '成功', color: 'bg-emerald-200 text-emerald-800' },
    error: { label: '失败', color: 'bg-rose-200 text-rose-800' },
  };

  const badge = statusMap[status];

  return (
    <div className="flex items-center justify-between border border-stone-200 rounded-md px-3 py-2">
      <div>
        <div className="text-sm font-semibold">{model.label}</div>
        <div className="text-xs text-stone-500">{model.provider}</div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
    </div>
  );
}
