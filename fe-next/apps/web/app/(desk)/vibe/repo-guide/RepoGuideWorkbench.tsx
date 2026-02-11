'use client';

import { useMemo, useState } from 'react';

type SessionResponse = {
  sessionId: string;
  repoKey: string;
  state: string;
  branch: string;
};

type IndexStatus = {
  sessionId: string;
  repoKey: string;
  state: 'CREATED' | 'INDEXING' | 'READY' | 'FAILED';
  progress: number;
  stats: {
    totalFiles: number;
    indexableFiles: number;
    skeletonFiles: number;
    symbolCount: number;
  };
  updatedAt: string;
  error?: string;
};

type AskResponse = {
  answer: string;
  phase: string;
  stepsUsed: number;
  evidence: Array<{
    kind: string;
    path: string;
    startLine: number;
    endLine: number;
    blobUrl: string;
    snippet: string;
  }>;
  toolTrace: Array<{
    step: number;
    phase: string;
    tool: string;
    input: Record<string, unknown>;
    observation: string;
  }>;
};

const statusColor: Record<IndexStatus['state'], string> = {
  CREATED: 'bg-stone-100 text-stone-700',
  INDEXING: 'bg-amber-100 text-amber-800',
  READY: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-rose-100 text-rose-800',
};

export default function RepoGuideWorkbench() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/HKUDS/nanobot');
  const [branch, setBranch] = useState('main');
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [status, setStatus] = useState<IndexStatus | null>(null);
  const [question, setQuestion] = useState('分析这个项目的鉴权链路，告诉我入口和核心函数');
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState<'session' | 'index' | 'status' | 'ask' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canIndex = Boolean(session?.sessionId);
  const canAsk = status?.state === 'READY' && Boolean(session?.sessionId);

  const prettyStats = useMemo(() => {
    if (!status) return null;
    const stats = status.stats;
    return `Files ${stats.totalFiles} | Indexable ${stats.indexableFiles} | Skeleton ${stats.skeletonFiles} | Symbols ${stats.symbolCount}`;
  }, [status]);

  const createSession = async () => {
    setLoading('session');
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch('/api/vibe/repo-guide/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, branch: branch || undefined }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || '创建 session 失败');

      setSession(body as SessionResponse);
      setStatus(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const startIndex = async () => {
    if (!session?.sessionId) return;

    setLoading('index');
    setError(null);

    try {
      const res = await fetch('/api/vibe/repo-guide/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || '触发索引失败');

      if (body?.status) {
        setStatus(body.status as IndexStatus);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const refreshStatus = async () => {
    if (!session?.sessionId) return;

    setLoading('status');
    setError(null);

    try {
      const query = new URLSearchParams({ sessionId: session.sessionId }).toString();
      const res = await fetch(`/api/vibe/repo-guide/status?${query}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || '获取状态失败');

      setStatus(body as IndexStatus);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const askQuestion = async () => {
    if (!session?.sessionId) return;

    setLoading('ask');
    setError(null);

    try {
      const res = await fetch('/api/vibe/repo-guide/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          question,
          maxSteps: 8,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || '提问失败');

      setAnswer(body as AskResponse);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-desk text-ink px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-6 space-y-4">
          <div className="text-xs uppercase tracking-[0.24em] text-stone-500 font-semibold">Vibe · Repo Guide</div>
          <h1 className="text-3xl font-serif font-semibold">仓库阅读 Agent（Skeleton + DeepSeek）</h1>
          <p className="text-sm text-stone-600">
            先建骨架索引，再由 Agent 按“定位 -&gt; 概览 -&gt; 深读”循环读取，最后给你人话讲解。
          </p>
        </header>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-5 space-y-3">
            <h2 className="text-lg font-semibold">1) 创建 Session</h2>
            <label className="block text-xs text-stone-500 font-semibold">仓库 URL / 本地绝对路径</label>
            <input
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
            />
            <label className="block text-xs text-stone-500 font-semibold">分支（可选）</label>
            <input
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
            />
            <button
              className="px-4 py-2 rounded-md bg-action text-white text-sm font-semibold disabled:opacity-60"
              disabled={loading === 'session'}
              onClick={createSession}
            >
              {loading === 'session' ? '创建中...' : '创建 Session'}
            </button>

            {session && (
              <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-md p-3 space-y-1">
                <div>sessionId: {session.sessionId}</div>
                <div>repoKey: {session.repoKey}</div>
                <div>branch: {session.branch}</div>
              </div>
            )}
          </div>

          <div className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-5 space-y-3">
            <h2 className="text-lg font-semibold">2) 构建与查询索引</h2>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-md bg-stone-900 text-white text-sm font-semibold disabled:opacity-60"
                disabled={!canIndex || loading === 'index'}
                onClick={startIndex}
              >
                {loading === 'index' ? '构建中...' : '开始构建索引'}
              </button>
              <button
                className="px-4 py-2 rounded-md bg-stone-100 text-stone-700 text-sm font-semibold border border-stone-200 disabled:opacity-60"
                disabled={!canIndex || loading === 'status'}
                onClick={refreshStatus}
              >
                {loading === 'status' ? '刷新中...' : '刷新状态'}
              </button>
            </div>

            {status && (
              <div className="space-y-2">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusColor[status.state]}`}>
                  {status.state}
                </span>
                <div className="text-xs text-stone-500">Progress: {status.progress}%</div>
                <div className="text-xs text-stone-600">{prettyStats}</div>
                {status.error && <div className="text-xs text-rose-600">{status.error}</div>}
              </div>
            )}
          </div>
        </section>

        <section className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-5 space-y-3">
          <h2 className="text-lg font-semibold">3) 向 Agent 提问</h2>
          <textarea
            className="w-full min-h-[96px] rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button
            className="px-4 py-2 rounded-md bg-action text-white text-sm font-semibold disabled:opacity-60"
            disabled={!canAsk || loading === 'ask'}
            onClick={askQuestion}
          >
            {loading === 'ask' ? '分析中...' : '开始讲解'}
          </button>
          {!canAsk && <div className="text-xs text-stone-500">请先构建索引并确保状态为 READY。</div>}
        </section>

        {error && <section className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-4">{error}</section>}

        {answer && (
          <section className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6">
            <article className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-5 space-y-3">
              <h3 className="text-lg font-semibold">讲解结果</h3>
              <div className="text-xs text-stone-500">
                phase={answer.phase} · steps={answer.stepsUsed}
              </div>
              <div className="text-sm whitespace-pre-wrap leading-7">{answer.answer}</div>
            </article>

            <aside className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-5 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">源码证据</h4>
                <div className="space-y-3">
                  {answer.evidence.length === 0 && <div className="text-xs text-stone-500">暂无证据</div>}
                  {answer.evidence.map((item, index) => (
                    <div key={`${item.path}-${index}`} className="border border-stone-200 rounded-md p-3 bg-white">
                      <div className="text-xs text-stone-500">[{item.kind}]</div>
                      <div className="text-sm font-semibold break-all">{item.path}</div>
                      <div className="text-xs text-stone-500">lines {item.startLine}-{item.endLine}</div>
                      <a
                        className="text-xs text-action hover:underline break-all"
                        href={item.blobUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.blobUrl}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">工具轨迹</h4>
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {answer.toolTrace.map((item, index) => (
                    <div key={`${item.tool}-${index}`} className="text-xs border border-stone-200 rounded-md p-2 bg-stone-50">
                      <div className="font-semibold">
                        {item.step}. {item.phase} -&gt; {item.tool}
                      </div>
                      <div className="text-stone-600 break-all">{item.observation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
