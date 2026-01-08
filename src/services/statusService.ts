import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentBranchName, getCurrentHead } from '../utils/head';
import { OBJECTS_PATH, VCS_DIR, IGNORE_PATH, INDEX_PATH } from '../utils/constants';
import { hashContent } from '../utils/hash';

const getIgnorePatterns = async (): Promise<string[]> => {
  try {
    const ignoreContent = await fs.readFile(IGNORE_PATH, 'utf-8');
    return ignoreContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  } catch (error) {
    return [];
  }
};

const shouldIgnore = (name: string, patterns: string[]): boolean => {
  return patterns.some((pattern) => {
    // Handle simple patterns like "node_modules", "*.log", "dist/"
    if (pattern === name || pattern === `${name}/`) {
      return true;
    }
    // Handle glob patterns like *.log
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1);
      return name.endsWith(ext);
    }
    // Handle directory patterns like dir/
    if (pattern.endsWith('/') && name === pattern.slice(0, -1)) {
      return true;
    }
    return false;
  });
};

const getTrackedFiles = async (commitHash: string | null): Promise<Map<string, string>> => {
  const trackedFiles = new Map<string, string>();

  if (!commitHash) return trackedFiles;

  try {
    const commitPath = path.join(OBJECTS_PATH, commitHash.substring(0, 2), commitHash.substring(2));
    const commitData = JSON.parse(await fs.readFile(commitPath, 'utf-8'));

    if (commitData.files && Array.isArray(commitData.files)) {
      for (const entry of commitData.files) {
        trackedFiles.set(entry.path, entry.hash);
      }
    }
  } catch (error) {
    // Commit data not found or invalid format
  }

  return trackedFiles;
};

const readIndex = async (): Promise<{ path: string; hash: string }[]> => {
  try {
    const content = await fs.readFile(INDEX_PATH, 'utf-8');
    if (!content) return [];
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed.map((e: any) => ({ path: e.path, hash: e.hash }));
    if (parsed && typeof parsed === 'object') return Object.entries(parsed).map(([p, h]) => ({ path: p, hash: h as string }));
    return [];
  } catch {
    return [];
  }
};

const normalizeRelativePath = (pathValue: string): string => {
  const normalized = pathValue.split('\\').join('/');
  if (normalized && !normalized.startsWith('./') && !normalized.startsWith('../') && !normalized.startsWith('/')) {
    return './' + normalized;
  }
  return normalized;
};

const walk = async (dir: string, repoRoot: string, ignorePatterns: string[]): Promise<string[]> => {
  let files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.name === VCS_DIR || shouldIgnore(entry.name, ignorePatterns)) continue;

    if (entry.isDirectory()) {
      files = files.concat(await walk(res, repoRoot, ignorePatterns));
    } else {
      files.push(normalizeRelativePath(path.relative(repoRoot, res)));
    }
  }
  return files;
};

export const status = async () => {
  try {
    const currentBranch = await getCurrentBranchName();
    const currentHead = await getCurrentHead();
    const trackedFiles = await getTrackedFiles(currentHead);
    const ignorePatterns = await getIgnorePatterns();
    const indexEntries = await readIndex();

    const indexMap = new Map<string, string>();
    for (const entry of indexEntries) {
      indexMap.set(entry.path, entry.hash);
    }

    console.log(`On branch ${chalk.cyan(currentBranch || 'detached HEAD')}`);

    const repoRoot = process.cwd();
    const allFiles = await walk(repoRoot, repoRoot, ignorePatterns);

    const stagedAdditions: string[] = [];
    const stagedModifications: string[] = [];
    const stagedDeletions: string[] = [];
    const modifiedFiles: string[] = [];
    const deletedFiles: string[] = [];
    const untrackedFiles: string[] = [];

    // All known paths from worktree, index, and HEAD
    const allKnownPaths = new Set([
      ...allFiles,
      ...indexMap.keys(),
      ...trackedFiles.keys()
    ]);

    const worktreeSet = new Set(allFiles);

    for (const relPath of allKnownPaths) {
      const indexHash = indexMap.get(relPath);
      const headHash = trackedFiles.get(relPath);
      const isWorktree = worktreeSet.has(relPath);

      // 1. Check for staged changes (Index vs HEAD)
      if (indexHash !== headHash) {
        if (!headHash && indexHash) {
          stagedAdditions.push(relPath);
        } else if (headHash && !indexHash) {
          stagedDeletions.push(relPath);
        } else if (headHash && indexHash && headHash !== indexHash) {
          stagedModifications.push(relPath);
        }
      }

      // 2. Check for unstaged changes (Worktree vs Index/HEAD)
      if (isWorktree) {
        const fileBuffer = await fs.readFile(path.join(repoRoot, relPath));
        const fileHash = hashContent(fileBuffer);

        const baseHash = indexHash || headHash;
        if (baseHash) {
          if (fileHash !== indexHash && indexHash) {
            modifiedFiles.push(relPath);
          } else if (fileHash !== headHash && !indexHash) {
            // Tracked in HEAD but not in index (and not staged for deletion)
            modifiedFiles.push(relPath);
          }
        } else {
          untrackedFiles.push(relPath);
        }
      } else {
        // Missing from worktree
        if (indexHash || headHash) {
          // If it's in index but not worktree, and we haven't staged its deletion
          if (indexHash) {
            deletedFiles.push(relPath);
          }
        }
      }
    }

    if (stagedAdditions.length > 0 || stagedModifications.length > 0 || stagedDeletions.length > 0) {
      console.log(`\n${chalk.green('Changes to be committed:')}`);
      console.log(`  (use "${chalk.cyan('brch reset')}" to unstage)`);
      for (const file of stagedAdditions) console.log(`\t${chalk.green('new file:')}   ${file}`);
      for (const file of stagedModifications) console.log(`\t${chalk.green('modified:')}   ${file}`);
      for (const file of stagedDeletions) console.log(`\t${chalk.green('deleted:')}    ${file}`);
    }

    if (modifiedFiles.length > 0 || deletedFiles.length > 0) {
      console.log(`\n${chalk.red('Changes not staged for commit:')}`);
      console.log(`  (use "${chalk.cyan('brch add')}" to stage changes)`);
      for (const file of modifiedFiles) console.log(`\t${chalk.red('modified:')}   ${file}`);
      for (const file of deletedFiles) console.log(`\t${chalk.red('deleted:')}    ${file}`);
    }

    if (untrackedFiles.length > 0) {
      console.log(`\n${chalk.red('Untracked files:')}`);
      console.log(`  (use "${chalk.cyan('brch add')}" to include in what will be committed)`);
      for (const file of untrackedFiles) {
        console.log(`\t${file}`);
      }
    }

    if (stagedAdditions.length === 0 && stagedModifications.length === 0 && stagedDeletions.length === 0 &&
      modifiedFiles.length === 0 && deletedFiles.length === 0 && untrackedFiles.length === 0) {
      console.log(chalk.green('nothing to commit, working tree clean'));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('Error getting status:', message);
    process.exit(1);
  }
};

