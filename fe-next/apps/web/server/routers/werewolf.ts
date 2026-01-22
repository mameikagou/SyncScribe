import { Hono } from 'hono';

import { PlayerRole } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { WerewolfEngine } from '@/server/services/vibe/werewolf/engine';

const werewolfRouter = new Hono()
  .post('create', async (c) => {
    const defaultModel = process.env.WEREWOLF_MODEL ?? 'gpt-4o-mini';
    const roles: PlayerRole[] = [
      PlayerRole.WOLF,
      PlayerRole.WOLF,
      PlayerRole.VILLAGER,
      PlayerRole.VILLAGER,
      PlayerRole.SEER,
      PlayerRole.WITCH,
    ];

    const players = roles.map((role, index) => ({
      seat: index + 1,
      name: `${index + 1}号玩家`,
      role,
      modelName: defaultModel,
    }));

    const game = await prisma.game.create({
      data: {
        players: {
          create: players,
        },
      },
      include: {
        players: true,
        logs: true,
      },
    });

    return c.json({ game });
  })
  .get(':id', async (c) => {
    const id = c.req.param('id');
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        players: true,
        logs: {
          include: {
            player: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!game) {
      return c.json({ error: 'Game not found' }, 404);
    }

    return c.json({ game });
  })
  .post(':id/next', async (c) => {
    const id = c.req.param('id');
    const engine = new WerewolfEngine();

    await engine.progressGame(id);

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        players: true,
        logs: {
          include: {
            player: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!game) {
      return c.json({ error: 'Game not found' }, 404);
    }

    return c.json({ game });
  });

export default werewolfRouter;
