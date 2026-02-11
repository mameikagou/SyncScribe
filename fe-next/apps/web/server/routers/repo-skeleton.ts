import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import {
  generateRepoSkeleton,
  saveRepoSkeletonToFile,
} from '@/server/services/vibe/repo-guide/skeleton';

const DEFAULT_DEMO_REPO_PATH = '/Users/mrlonely/mrlonely/mrlonely-code/gitclone/nanobot';

const payloadSchema = z.object({
  repoPath: z.string().trim().min(1).optional(),
  outputPath: z.string().trim().min(1).optional(),
  maxFiles: z.number().int().min(10).max(20_000).optional(),
  maxFileSizeKb: z.number().int().min(16).max(4_096).optional(),
  includeSkeleton: z.boolean().optional(),
});

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const repoSkeletonRouter = new Hono().post('generate', zValidator('json', payloadSchema), async (c) => {
  const payload = c.req.valid('json');

  const repoPath = payload.repoPath ?? DEFAULT_DEMO_REPO_PATH;
  const maxFileSizeBytes = payload.maxFileSizeKb ? payload.maxFileSizeKb * 1_024 : undefined;

  try {
    const skeleton = await generateRepoSkeleton({
      repoPath,
      maxFiles: payload.maxFiles,
      maxFileSizeBytes,
    });

    const savedPath = payload.outputPath
      ? await saveRepoSkeletonToFile(skeleton, payload.outputPath)
      : undefined;

    const filesPreview = skeleton.files.slice(0, 12).map((file) => ({
      path: file.path,
      language: file.language,
      symbolCount: file.symbolCount,
      symbols: file.symbols.slice(0, 6),
    }));

    return c.json({
      repoPath: skeleton.repoPath,
      savedPath,
      summary: skeleton.summary,
      filesPreview,
      errors: skeleton.errors.slice(0, 20),
      skeleton: payload.includeSkeleton ? skeleton : undefined,
    });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to generate repo skeleton',
        detail: formatError(error),
      },
      400,
    );
  }
});

export default repoSkeletonRouter;
