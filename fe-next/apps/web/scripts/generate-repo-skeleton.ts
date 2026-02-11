#!/usr/bin/env bun
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateRepoSkeleton,
  saveRepoSkeletonToFile,
} from '../server/services/vibe/repo-guide/skeleton';

const DEFAULT_REPO_PATH = '/Users/mrlonely/mrlonely/mrlonely-code/gitclone/nanobot';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultOutputPath = path.resolve(__dirname, '../tmp/nanobot-skeleton.json');

const argv = typeof Bun !== 'undefined' ? Bun.argv : process.argv;

const repoPath = argv[2] ?? DEFAULT_REPO_PATH;
const outputPath = argv[3] ?? defaultOutputPath;
const maxFilesArg = argv[4];

const parseMaxFiles = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('maxFiles must be a positive integer');
  }
  return parsed;
};

async function main() {
  const maxFiles = parseMaxFiles(maxFilesArg);

  const skeleton = await generateRepoSkeleton({
    repoPath,
    maxFiles,
  });

  const savedPath = await saveRepoSkeletonToFile(skeleton, outputPath);

  console.log(
    JSON.stringify(
      {
        repoPath: skeleton.repoPath,
        savedPath,
        summary: skeleton.summary,
        sampleFiles: skeleton.files.slice(0, 8).map((file) => ({
          path: file.path,
          language: file.language,
          symbolCount: file.symbolCount,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
