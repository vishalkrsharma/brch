import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { createTwoFilesPatch } from 'diff';
import { getCurrentHead } from '../utils/head';
import { OBJECTS_PATH, VCS_DIR, IGNORE_PATH } from '../utils/constants';
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

const getFileContentFromHash = async (hash: string): Promise<string> => {
  try {
    const objectPath = path.join(OBJECTS_PATH, hash.substring(0, 2), hash.substring(2));
    return await fs.readFile(objectPath, 'utf-8');
  } catch (error) {
    return '';
  }
};

const colorDiffLine = (line: string): string => {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return chalk.green(line);
  } else if (line.startsWith('-') && !line.startsWith('---')) {
    return chalk.red(line);
  } else if (line.startsWith('@@')) {
    return chalk.cyan(line);
  } else if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
    return chalk.bold(line);
  }
  return line;
};

export const diff = async () => {
  try {
    const currentHead = await getCurrentHead();
    const trackedFiles = await getTrackedFiles(currentHead);
    const ignorePatterns = await getIgnorePatterns();

    if (!currentHead) {
      console.log(chalk.yellow('No commits yet. Nothing to diff.'));
      return;
    }

    const workdir = process.cwd();
    const entries = await fs.readdir(workdir, { withFileTypes: true });

    let hasDiffs = false;

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
        const filePath = path.join(workdir, entry.name);
        const fileHash = hashContent(filePath);
        const trackedHash = trackedFiles.get(entry.name);

        if (trackedHash && fileHash !== trackedHash) {
          // File has been modified
          const oldContent = await getFileContentFromHash(trackedHash);
          const newContent = await fs.readFile(filePath, 'utf-8');

          const patch = createTwoFilesPatch(
            `a/${entry.name}`,
            `b/${entry.name}`,
            oldContent,
            newContent,
            'HEAD',
            'Working Directory'
          );

          // Print the diff with colors
          const lines = patch.split('\n');
          for (const line of lines) {
            console.log(colorDiffLine(line));
          }
          console.log(''); // Empty line between files
          hasDiffs = true;
        }
      }
    }

    if (!hasDiffs) {
      console.log(chalk.green('No changes detected.'));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('Error generating diff:', message);
    process.exit(1);
  }
};