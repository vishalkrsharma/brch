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

    if (commitData.tree) {
      const treePath = path.join(OBJECTS_PATH, commitData.tree.substring(0, 2), commitData.tree.substring(2));
      const treeData = JSON.parse(await fs.readFile(treePath, 'utf-8'));

      for (const [file, hash] of Object.entries(treeData)) {
        trackedFiles.set(file, hash as string);
      }
    }
  } catch (error) {
    // Tree data not found, return empty
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

const stripLeadingDot = (p: string) => (p.startsWith('./') ? p.slice(2) : p);

export const status = async () => {
  try {
    const currentBranch = await getCurrentBranchName();
    const currentHead = await getCurrentHead();
    const trackedFiles = await getTrackedFiles(currentHead);
    const ignorePatterns = await getIgnorePatterns();
    const indexEntries = await readIndex();
    const stagedSet = new Set(indexEntries.map((e) => stripLeadingDot(e.path)));

    console.log(`On branch ${chalk.cyan(currentBranch || 'detached HEAD')}`);

    const workdir = process.cwd();
    const entries = await fs.readdir(workdir, { withFileTypes: true });

    const stagedFiles: string[] = [];
    const modifiedFiles: string[] = [];
    const untrackedItems: { name: string; type: 'file' | 'directory' }[] = [];

    for (const entry of entries) {
      // Skip VCS directory
      if (entry.name === VCS_DIR) {
        continue;
      }

      // Skip ignored files and folders
      if (shouldIgnore(entry.name, ignorePatterns)) {
        continue;
      }

      if (entry.isFile()) {
        // If file is staged, show it under staged and skip other checks
        if (stagedSet.has(entry.name)) {
          stagedFiles.push(entry.name);
          continue;
        }
        const filePath = path.join(workdir, entry.name);
        const fileHash = hashContent(filePath);
        const trackedHash = trackedFiles.get(entry.name);

        if (trackedHash) {
          if (fileHash !== trackedHash) {
            modifiedFiles.push(entry.name);
          }
        } else {
          untrackedItems.push({ name: entry.name, type: 'file' });
        }
      } else if (entry.isDirectory()) {
        untrackedItems.push({ name: entry.name, type: 'directory' });
      }
    }

    if (stagedFiles.length > 0) {
      console.log(`\n${chalk.green('Changes to be committed:')}`);
      console.log(`  (use "${chalk.cyan('brch reset')}" to unstage)`);
      for (const file of stagedFiles) {
        console.log(`\t${chalk.green('new file:')} ${file}`);
      }
    }

    if (modifiedFiles.length > 0) {
      console.log(`\n${chalk.red('Changes not staged for commit:')}`);
      console.log(`  (use "${chalk.cyan('brch add')}" to stage changes)`);
      for (const file of modifiedFiles) {
        console.log(`\t${chalk.red('modified:')} ${file}`);
      }
    }

    if (untrackedItems.length > 0) {
      console.log(`\n${chalk.red('Untracked files and directories:')}`);
      console.log(`  (use "${chalk.cyan('brch add')}" to include in what will be committed)`);
      for (const item of untrackedItems) {
        const suffix = item.type === 'directory' ? '/' : '';
        console.log(`\t${item.name}${suffix}`);
      }
    }

    if (modifiedFiles.length === 0 && untrackedItems.length === 0) {
      console.log(chalk.green('nothing to commit, working tree clean'));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('Error getting status:', message);

    process.exit(1);
  }
};
