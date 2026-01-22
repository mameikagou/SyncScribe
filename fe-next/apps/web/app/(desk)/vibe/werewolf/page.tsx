'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useRef, useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type GamePlayer = {
  id: string;
  seat: number;
  name: string;
  role: 'WOLF' | 'VILLAGER' | 'SEER' | 'WITCH';
  isAlive: boolean;
  modelName: string;
};

type GameLog = {
  id: string;
  round: number;
  phase: 'NIGHT_WOLF' | 'DAY_DISCUSS';
  thought: string | null;
  speech: string | null;
  action: unknown;
  player?: GamePlayer | null;
};

type Game = {
  id: string;
  round: number;
  phase: 'NIGHT_WOLF' | 'DAY_DISCUSS';
  players: GamePlayer[];
  logs: GameLog[];
};

type GameResponse = {
  game: Game;
  error?: string;
};

const phaseLabelMap: Record<Game['phase'], string> = {
  NIGHT_WOLF: '夜晚 · 狼人行动',
  DAY_DISCUSS: '白天 · 公共讨论',
};

const roleLabelMap: Record<GamePlayer['role'], string> = {
  WOLF: '狼人',
  VILLAGER: '村民',
  SEER: '预言家',
  WITCH: '女巫',
};

export default function WerewolfPage() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createOnceRef = useRef(false);
  const createGame = async () => {
    setIsCreating(true);
    setError(null);
    const res = await fetch('/api/vibe/werewolf/create', { method: 'POST' });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || '创建失败');
    }
    const data = (await res.json()) as GameResponse;
    if (!data.game?.id) {
      throw new Error('创建结果为空');
    }
    window.localStorage.setItem('werewolf:gameId', data.game.id);
    setGameId(data.game.id);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem('werewolf:gameId');
    if (stored) {
      setGameId(stored);
      return;
    }

    if (createOnceRef.current) return;
    createOnceRef.current = true;
    createGame()
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setIsCreating(false);
      });
  }, []);

  const { data, isLoading, mutate } = useSWR<GameResponse>(
    gameId ? `/api/vibe/werewolf/${gameId}` : null,
    fetcher
  );

  const game = data?.game;
  const logs = game?.logs ?? [];
  const players = useMemo(
    () => (game?.players ?? []).slice().sort((a, b) => a.seat - b.seat),
    [game?.players]
  );

  const [isAdvancing, setIsAdvancing] = useState(false);
  const handleNextStep = async () => {
    if (!gameId) return;
    setIsAdvancing(true);
    try {
      const res = await fetch(`/api/vibe/werewolf/${gameId}/next`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || '推进失败');
      }
      await mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleNewGame = async () => {
    try {
      await createGame();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-desk text-ink px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md px-6 py-5 flex flex-col gap-3">
          <div className="text-xs uppercase tracking-[0.24em] text-stone-500 font-semibold">Vibe · Werewolf</div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-semibold">AI 狼人杀对局台</h1>
              <p className="text-sm text-stone-500">
                回合 {game?.round ?? '-'} · {game ? phaseLabelMap[game.phase] : '加载中'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="px-6 py-3 rounded-full bg-action text-white font-semibold shadow-md disabled:opacity-60"
                onClick={handleNextStep}
                disabled={!gameId || isAdvancing || isCreating}
              >
                {isAdvancing ? '推进中...' : 'Next Step'}
              </button>
              <button
                className="px-6 py-3 rounded-full border border-stone-200 bg-white text-stone-700 font-semibold shadow-sm disabled:opacity-60"
                onClick={handleNewGame}
                disabled={isCreating}
              >
                重新开局
              </button>
            </div>
          </div>
          {(isCreating || isLoading) && (
            <p className="text-sm text-stone-500">正在准备对局数据...</p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </header>

        <div className="grid lg:grid-cols-[1.1fr,1.4fr] gap-6">
          <section className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">玩家席位</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`border rounded-md p-4 space-y-2 ${
                    player.isAlive ? 'border-ink-faint bg-white' : 'border-stone-200 bg-stone-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {player.seat}号 · {player.name}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        player.isAlive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {player.isAlive ? '存活' : '淘汰'}
                    </span>
                  </div>
                  <div className="text-sm text-stone-600">身份：{roleLabelMap[player.role]}</div>
                  <div className="text-xs text-stone-500">模型：{player.modelName}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-4">消息流</h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {logs.length === 0 && (
                <p className="text-sm text-stone-500">暂无发言，点击 Next Step 推进。</p>
              )}
              {logs.map((log) => {
                const speaker = log.player
                  ? `${log.player.seat}号${log.player.name}`
                  : '系统';
                return (
                  <div key={log.id} className="space-y-1">
                    <div className="text-xs text-stone-400">
                      Day {log.round} · {speaker}
                    </div>
                    {log.thought && (
                      <div className="text-xs text-stone-400">Thought: {log.thought}</div>
                    )}
                    <div className="bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm text-ink">
                      {log.speech || '...'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
