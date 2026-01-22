import { GamePhase, PlayerRole } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { runAgentTurn } from './agent';

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

const buildSystemPrompt = (options: {
  phase: GamePhase;
  playerName: string;
  role: PlayerRole;
  alivePlayers: Array<{ id: string; seat: number; name: string; role: PlayerRole }>;
}) => {
  const { phase, playerName, role, alivePlayers } = options;
  const roster = alivePlayers
    .map((player) => `${player.seat}号${player.name}(${player.id})`)
    .join('、');

  if (phase === GamePhase.NIGHT_WOLF) {
    return [
      '你是狼人杀玩家，只能输出符合 JSON Schema 的对象。',
      `你的名字是 ${playerName}，你的身份是 ${role}。`,
      `当前是夜晚，存活玩家有：${roster}。`,
      '作为狼人请选择一个目标击杀，action 只能是 kill 或 pass。',
      'target 请输出玩家ID。speech 可以为空，thought 写内心独白。',
    ].join('\n');
  }

  return [
    '你是狼人杀玩家，只能输出符合 JSON Schema 的对象。',
    `你的名字是 ${playerName}，你的身份是 ${role}。`,
    `当前是白天讨论，存活玩家有：${roster}。`,
    '请发表你的发言，action 只能是 pass 或 vote 或 check。',
    '如果要投票或验人，target 请输出玩家ID。',
  ].join('\n');
};

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

    const alivePlayers = game.players
      .filter((player) => player.isAlive)
      .sort((a, b) => a.seat - b.seat);
    const gameHistory = buildGameHistory(game.logs);

    if (game.phase === GamePhase.NIGHT_WOLF) {
      const wolf = alivePlayers.find((player) => player.role === PlayerRole.WOLF);

      if (!wolf) {
        await prisma.game.update({
          where: { id: game.id },
          data: {
            phase: GamePhase.DAY_DISCUSS,
            nextPlayerIndex: 0,
          },
        });
        return { ok: true, skipped: 'no-wolf' };
      }

      const systemPrompt = buildSystemPrompt({
        phase: game.phase,
        playerName: wolf.name,
        role: wolf.role,
        alivePlayers,
      });
      const turn = await runAgentTurn(wolf.modelName, systemPrompt, gameHistory);
      const resolvedTarget = resolveTargetPlayer(alivePlayers, turn.target);
      const targetPlayer =
        resolvedTarget ?? alivePlayers.find((player) => player.role !== PlayerRole.WOLF) ?? null;

      if (turn.action === 'kill' && targetPlayer) {
        await prisma.gamePlayer.update({
          where: { id: targetPlayer.id },
          data: { isAlive: false },
        });
      }

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

    const speaker = alivePlayers[currentIndex];
    const systemPrompt = buildSystemPrompt({
      phase: game.phase,
      playerName: speaker.name,
      role: speaker.role,
      alivePlayers,
    });
    const turn = await runAgentTurn(speaker.modelName, systemPrompt, gameHistory);
    const resolvedTarget = resolveTargetPlayer(alivePlayers, turn.target);

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

    await prisma.game.update({
      where: { id: game.id },
      data: {
        nextPlayerIndex: currentIndex + 1,
      },
    });

    return { ok: true, phase: 'DAY_DISCUSS' };
  }
}
