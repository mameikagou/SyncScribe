import { GamePhase, PlayerRole } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { runAgentTurn } from './agent';

// 将历史日志拼接成“可读上下文”。
// 游戏意义：让 AI 记住上一轮、上一位玩家说了什么。
const buildGameHistory = (
  logs: Array<{
    round: number;
    speech: string | null;
    phase: GamePhase;
    player: { seat: number; name: string } | null;
  }>
) =>
  logs
    .map((log) => {
      const playerLabel = log.player
        ? `${log.player.seat}号${log.player.name}`
        : '系统';
      const speech = log.speech?.trim() ? log.speech : '...';
      return `[Day ${log.round}] ${playerLabel}: ${speech}`;
    })
    .join('\n');

// system prompt 是“角色规则说明书”。
// 游戏意义：告诉 AI 当前身份与阶段，避免“脱离剧本”。
const buildSystemPrompt = (options: {
  phase: GamePhase;
  playerName: string;
  role: PlayerRole;
  alivePlayers: Array<{ id: string; seat: number; name: string; role: PlayerRole }>;
}) => {
  const { phase, playerName, role, alivePlayers } = options;
  // roster 中包含玩家 ID，便于模型在 action.target 中精确指向目标。
  const roster = alivePlayers
    .map((player) => `${player.seat}号${player.name}(${player.id})`)
    .join('、');

  if (phase === GamePhase.NIGHT_WOLF) {
    // 夜晚：狼人行动阶段（MVP 仅处理狼人杀人）
    return [
      '你是狼人杀玩家，只能输出符合 JSON Schema 的对象。',
      `你的名字是 ${playerName}，你的身份是 ${role}。`,
      `当前是夜晚，存活玩家有：${roster}。`,
      '作为狼人请选择一个目标击杀，action 只能是 kill 或 pass。',
      'target 请输出玩家ID。speech 可以为空，thought 写内心独白。',
    ].join('\n');
  }

  // 白天：公共讨论阶段（MVP 仅发言，不做处决流程）
  return [
    '你是狼人杀玩家，只能输出符合 JSON Schema 的对象。',
    `你的名字是 ${playerName}，你的身份是 ${role}。`,
    `当前是白天讨论，存活玩家有：${roster}。`,
    '请发表你的发言，action 只能是 pass 或 vote 或 check。',
    '如果要投票或验人，target 请输出玩家ID。',
  ].join('\n');
};

// 解析 target 指向的玩家。
// 允许模型用 ID / 名字 / 座位号表达目标，提升容错率。
const resolveTargetPlayer = (
  alivePlayers: Array<{ id: string; seat: number; name: string; role: PlayerRole }>,
  target?: string
) => {
  if (!target) return null;
  const normalized = target.trim();
  return (
    alivePlayers.find((player) => player.id === normalized) ??
    alivePlayers.find((player) => player.name === normalized) ??
    alivePlayers.find((player) => String(player.seat) === normalized)
  );
};

export class WerewolfEngine {
  async progressGame(gameId: string) {
    // 读取游戏 + 玩家 + 日志，用于构建 AI 上下文
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
        logs: {
          include: {
            player: {
              select: { seat: true, name: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    // 只处理“存活玩家”，并按座位号排序保证发言顺序稳定
    // Array.prototype.sort 会原地排序，这里先 filter 出新数组再排序即可。
    const alivePlayers = game.players
      .filter((player) => player.isAlive)
      .sort((a, b) => a.seat - b.seat);
    const gameHistory = buildGameHistory(game.logs);

    if (game.phase === GamePhase.NIGHT_WOLF) {
      // 夜晚阶段：找到一只存活狼人执行杀人动作
      const wolf = alivePlayers.find((player) => player.role === PlayerRole.WOLF);

      if (!wolf) {
        // 没有狼人就直接跳到白天（极端情况下的兜底）
        await prisma.game.update({
          where: { id: game.id },
          data: {
            phase: GamePhase.DAY_DISCUSS,
            nextPlayerIndex: 0,
          },
        });
        return { ok: true, skipped: 'no-wolf' };
      }

      // 调用 AI 生成“狼人决策”
      const systemPrompt = buildSystemPrompt({
        phase: game.phase,
        playerName: wolf.name,
        role: wolf.role,
        alivePlayers,
      });
      const turn = await runAgentTurn(wolf.modelName, systemPrompt, gameHistory);
      const resolvedTarget = resolveTargetPlayer(alivePlayers, turn.target);
      // 若模型没给出有效 target，默认挑一个非狼人
      const targetPlayer =
        resolvedTarget ?? alivePlayers.find((player) => player.role !== PlayerRole.WOLF) ?? null;

      if (turn.action === 'kill' && targetPlayer) {
        // 夜晚击杀：更新目标存活状态
        await prisma.gamePlayer.update({
          where: { id: targetPlayer.id },
          data: { isAlive: false },
        });
      }

      // 写入夜晚日志：包括 thought/speech + 结构化 action
      await prisma.gameLog.create({
        data: {
          gameId: game.id,
          playerId: wolf.id,
          round: game.round,
          phase: game.phase,
          thought: turn.thought,
          speech: turn.speech,
          action: {
            ...turn,
            resolvedTargetId: targetPlayer?.id ?? null,
          },
        },
      });

      // 夜晚结束 → 进入白天讨论
      await prisma.game.update({
        where: { id: game.id },
        data: {
          phase: GamePhase.DAY_DISCUSS,
          nextPlayerIndex: 0,
        },
      });

      return { ok: true, phase: 'NIGHT_WOLF' };
    }

    const currentIndex = game.nextPlayerIndex;

    if (currentIndex >= alivePlayers.length) {
      // 白天发言结束 → 回到夜晚并进入下一回合
      await prisma.game.update({
        where: { id: game.id },
        data: {
          phase: GamePhase.NIGHT_WOLF,
          round: game.round + 1,
          nextPlayerIndex: 0,
        },
      });
      return { ok: true, phase: 'DAY_DISCUSS_END' };
    }

    // 白天发言：按座位号顺序逐个触发 AI
    const speaker = alivePlayers[currentIndex];
    const systemPrompt = buildSystemPrompt({
      phase: game.phase,
      playerName: speaker.name,
      role: speaker.role,
      alivePlayers,
    });
    const turn = await runAgentTurn(speaker.modelName, systemPrompt, gameHistory);
    const resolvedTarget = resolveTargetPlayer(alivePlayers, turn.target);

    // 写入白天日志：展示公开发言内容
    await prisma.gameLog.create({
      data: {
        gameId: game.id,
        playerId: speaker.id,
        round: game.round,
        phase: game.phase,
        thought: turn.thought,
        speech: turn.speech,
        action: {
          ...turn,
          resolvedTargetId: resolvedTarget?.id ?? null,
        },
      },
    });

    // 更新发言指针，推进到下一位玩家
    await prisma.game.update({
      where: { id: game.id },
      data: {
        nextPlayerIndex: currentIndex + 1,
      },
    });

    return { ok: true, phase: 'DAY_DISCUSS' };
  }
}
