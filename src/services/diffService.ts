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

export const diff = async (filePaths?: string[]) => {
  try {
    const currentHead = await getCurrentHead();
    const trackedFiles = await getTrackedFiles(currentHead);
    const ignorePatterns = await getIgnorePatterns();

    if (!currentHead) {
      console.log(chalk.yellow('No commits yet. Nothing to diff.'));
      return;
    }

    const repoRoot = process.cwd();
    let filesToCompare: string[] = [];

    if (filePaths && filePaths.length > 0) {
      for (const p of filePaths) {
        const absolutePath = path.resolve(repoRoot, p);
        try {
          const stats = await fs.stat(absolutePath);
          if (stats.isDirectory()) {
            const dirFiles = await walk(absolutePath, repoRoot, ignorePatterns);
            filesToCompare.push(...dirFiles);
          } else {
            const relativeToRoot = path.relative(repoRoot, absolutePath);
            filesToCompare.push(normalizeRelativePath(relativeToRoot));
          }
        } catch (error) {
          // File/directory doesn't exist, add it anyway to check if it was deleted (tracked)
          const relativeToRoot = path.relative(repoRoot, absolutePath);
          filesToCompare.push(normalizeRelativePath(relativeToRoot));
        }
      }
      filesToCompare = [...new Set(filesToCompare)];
    } else {
      filesToCompare = await walk(repoRoot, repoRoot, ignorePatterns);
    }

    let hasDiffs = false;

    for (const relPath of filesToCompare) {
      try {
        const fullPath = path.join(repoRoot, relPath);
        const fileBuffer = await fs.readFile(fullPath);
        const fileHash = hashContent(fileBuffer);
        const trackedHash = trackedFiles.get(relPath);

        if (trackedHash && fileHash !== trackedHash) {
          // File has been modified
          const oldContent = await getFileContentFromHash(trackedHash);
          const newContent = fileBuffer.toString('utf-8');

          const patch = createTwoFilesPatch(
            `a/${relPath}`,
            `b/${relPath}`,
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
      } catch (error) {
        // File might not exist or be unreadable, skip it
        // If it was specifically requested, we might want to show it's missing
        // but for now we follow the existing pattern of modifications only.
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