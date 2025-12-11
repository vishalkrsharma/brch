import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { VCS_DIR, OBJECT_DIR } from '../utils/constants';

type IndexEntry = Record<string, string>;

export type AddResult = {
  staged: string[];
  skipped: string[];
};

const INDEX_FILE = 'index.json';

export const addFiles = async (paths: string[]): Promise<AddResult> => {
  const repoRoot = process.cwd();
  const brchPath = join(repoRoot, VCS_DIR);
  if (!existsSync(brchPath)) {
    throw new Error('Not a brch repository (or any of the parent directories). Run `brch init` first.');
  }

  const objectDir = join(repoRoot, OBJECT_DIR);
  await mkdir(objectDir, { recursive: true });

  const { filesToStage, missing } = await collectFiles(paths, repoRoot);

  const indexPath = join(brchPath, INDEX_FILE);
  const indexEntries = await readIndex(indexPath);

  const staged: string[] = [];
  const skipped = [...missing];

  for (const absPath of filesToStage) {
    const relPath = normalizeRelativePath(relative(repoRoot, absPath));
    const fileBuffer = await readFile(absPath);
    const hash = createHash('sha1').update(fileBuffer).digest('hex');
    const objectPath = join(objectDir, hash);

    if (!existsSync(objectPath)) {
      await writeFile(objectPath, fileBuffer);
    }

    if (indexEntries[relPath] === hash) {
      skipped.push(relPath);
      continue;
    }

    indexEntries[relPath] = hash;
    staged.push(relPath);
  }

  await writeFile(indexPath, JSON.stringify(indexEntries, null, 2));

  return { staged, skipped };
};

const collectFiles = async (targets: string[], repoRoot: string): Promise<{ filesToStage: Set<string>; missing: string[] }> => {
  const filesToStage = new Set<string>();
  const missing: string[] = [];

  for (const target of targets) {
    const absTargetPath = resolve(repoRoot, target);
    if (!isWithinRepo(absTargetPath, repoRoot)) {
      missing.push(target);
      continue;
    }

    try {
      const targetStat = await stat(absTargetPath);
      if (targetStat.isDirectory()) {
        await walkDirectory(absTargetPath, repoRoot, filesToStage);
      } else if (targetStat.isFile()) {
        filesToStage.add(absTargetPath);
      }
    } catch (error) {
      missing.push(target);
    }
  }

  return { filesToStage, missing };
};

const walkDirectory = async (dir: string, repoRoot: string, collector: Set<string>): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    if (shouldIgnore(entryPath, repoRoot)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDirectory(entryPath, repoRoot, collector);
    } else if (entry.isFile()) {
      collector.add(entryPath);
    }
  }
};

const shouldIgnore = (absPath: string, repoRoot: string): boolean => {
  const relPath = normalizeRelativePath(relative(repoRoot, absPath));
  if (relPath === '') {
    return false;
  }

  return relPath === VCS_DIR || relPath.startsWith(`${VCS_DIR}/`);
};

const isWithinRepo = (absPath: string, repoRoot: string): boolean => {
  const relPath = relative(repoRoot, absPath);
  if (relPath === '') {
    return true;
  }

  return !relPath.startsWith('..') && !relPath.includes(`..${sep}`);
};

const normalizeRelativePath = (pathValue: string): string => {
  return pathValue.split('\\').join('/');
};

const readIndex = async (indexPath: string): Promise<IndexEntry> => {
  try {
    const content = await readFile(indexPath, 'utf-8');
    return content ? JSON.parse(content) : {};
  } catch (error) {
    return {};
  }
};
