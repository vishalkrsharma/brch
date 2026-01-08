import { mkdir, readdir, readFile, stat, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { VCS_DIR, OBJECTS_PATH, INDEX_FILE, IGNORE_FILE, INDEX_PATH, VCS_PATH } from '../utils/constants';
import { hashContent } from '../utils/hash';
import { getObjectPath } from '../utils/objectPath';

type IndexEntry = {
  path: string;
  hash: string;
};

export type AddResult = {
  staged: string[];
  skipped: string[];
};

export const addFiles = async (paths: string[]): Promise<AddResult> => {
  const repoRoot = process.cwd();

  try {
    await access(VCS_PATH, constants.F_OK);
  } catch {
    throw new Error('Not a brch repository (or any of the parent directories). Run `brch init` first.');
  }

  const objectsDir = join(repoRoot, OBJECTS_PATH);

  await mkdir(objectsDir, { recursive: true });

  const ignorePatterns = await loadIgnorePatterns(repoRoot);
  const { filesToStage, missing } = await collectFiles(paths, repoRoot, ignorePatterns);
  const indexEntries = await readIndex(INDEX_PATH);

  const staged: string[] = [];
  const skipped = [...missing];

  for (const absPath of filesToStage) {
    const relPath = normalizeRelativePath(relative(repoRoot, absPath));
    const fileBuffer = await readFile(absPath);
    const hash = hashContent(fileBuffer);
    const { objectDir, objectPath } = getObjectPath(hash, objectsDir);

    try {
      await access(objectPath, constants.F_OK);
    } catch {
      await mkdir(objectDir, { recursive: true });
      await writeFile(objectPath, fileBuffer);
    }

    const existingEntry = indexEntries.find((entry) => entry.path === relPath);
    if (existingEntry && existingEntry.hash === hash) {
      skipped.push(relPath);
      continue;
    }

    if (existingEntry) {
      existingEntry.hash = hash;
    } else {
      indexEntries.push({ path: relPath, hash });
    }
    staged.push(relPath);
  }

  await writeFile(INDEX_PATH, JSON.stringify(indexEntries, null, 2));

  return { staged, skipped };
};

const collectFiles = async (
  targets: string[],
  repoRoot: string,
  ignorePatterns: IgnorePattern[]
): Promise<{ filesToStage: Set<string>; missing: string[] }> => {
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
        await walkDirectory(absTargetPath, repoRoot, filesToStage, ignorePatterns);
      } else if (targetStat.isFile()) {
        if (!matchesIgnorePattern(absTargetPath, repoRoot, ignorePatterns)) {
          filesToStage.add(absTargetPath);
        }
      }
    } catch (error) {
      missing.push(target);
    }
  }

  return { filesToStage, missing };
};

const walkDirectory = async (dir: string, repoRoot: string, collector: Set<string>, ignorePatterns: IgnorePattern[]): Promise<void> => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    if (shouldIgnore(entryPath, repoRoot, ignorePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDirectory(entryPath, repoRoot, collector, ignorePatterns);
    } else if (entry.isFile()) {
      if (!matchesIgnorePattern(entryPath, repoRoot, ignorePatterns)) {
        collector.add(entryPath);
      }
    }
  }
};

type IgnorePattern = {
  pattern: string;
  negated: boolean;
  isDirectory: boolean;
};

const loadIgnorePatterns = async (repoRoot: string): Promise<IgnorePattern[]> => {
  const ignorePath = join(repoRoot, IGNORE_FILE);
  try {
    await access(ignorePath, constants.F_OK);
  } catch {
    return [];
  }

  try {
    const content = await readFile(ignorePath, 'utf-8');
    const patterns: IgnorePattern[] = [];

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const negated = trimmed.startsWith('!');
      const pattern = negated ? trimmed.slice(1) : trimmed;
      const isDirectory = pattern.endsWith('/');
      const normalizedPattern = isDirectory ? pattern.slice(0, -1) : pattern;

      patterns.push({
        pattern: normalizedPattern,
        negated,
        isDirectory,
      });
    }

    return patterns;
  } catch (error) {
    return [];
  }
};

const matchesIgnorePattern = (absPath: string, repoRoot: string, patterns: IgnorePattern[]): boolean => {
  const relPath = normalizeRelativePath(relative(repoRoot, absPath));
  if (relPath === '') {
    return false;
  }

  let matched = false;
  let matchedNegated = false;

  for (const { pattern, negated, isDirectory } of patterns) {
    if (matchesPattern(relPath, pattern, isDirectory)) {
      if (negated) {
        matchedNegated = true;
      } else {
        matched = true;
      }
    }
  }

  // Negated patterns override regular patterns
  return matched && !matchedNegated;
};

const matchesPattern = (relPath: string, pattern: string, isDirectoryPattern: boolean): boolean => {
  // Convert glob pattern to regex
  // Escape special regex characters except * and ?
  let regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '___DOUBLE_STAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/___DOUBLE_STAR___/g, '.*');

  // If pattern starts with /, it matches from root
  // Otherwise, it can match anywhere in the path
  if (pattern.startsWith('/')) {
    regexPattern = '^' + regexPattern.slice(1);
  } else {
    regexPattern = '(^|/)' + regexPattern;
  }

  // For directory patterns, match the directory itself or any parent
  if (isDirectoryPattern) {
    regexPattern = regexPattern + '/';
    const regex = new RegExp(regexPattern);

    // Check if the path itself matches (as a directory)
    if (regex.test(relPath + '/')) {
      return true;
    }

    // Check if any parent directory matches
    const pathParts = relPath.split('/');
    for (let i = 1; i <= pathParts.length; i++) {
      const subPath = pathParts.slice(0, i).join('/');
      if (regex.test(subPath + '/')) {
        return true;
      }
    }

    return false;
  } else {
    // For file patterns, match the exact path
    regexPattern = regexPattern + '$';
    const regex = new RegExp(regexPattern);
    return regex.test(relPath);
  }
};

const shouldIgnore = (absPath: string, repoRoot: string, ignorePatterns: IgnorePattern[]): boolean => {
  const relPath = normalizeRelativePath(relative(repoRoot, absPath));
  if (relPath === '') {
    return false;
  }

  // Always ignore .brch directory
  if (relPath === VCS_DIR || relPath.startsWith(`${VCS_DIR}/`) ||
    relPath === `./${VCS_DIR}` || relPath.startsWith(`./${VCS_DIR}/`)) {
    return true;
  }

  // Check against ignore patterns
  return matchesIgnorePattern(absPath, repoRoot, ignorePatterns);
};

const isWithinRepo = (absPath: string, repoRoot: string): boolean => {
  const relPath = relative(repoRoot, absPath);
  if (relPath === '') {
    return true;
  }

  return !relPath.startsWith('..') && !relPath.includes(`..${sep}`);
};

const normalizeRelativePath = (pathValue: string): string => {
  const normalized = pathValue.split('\\').join('/');
  // Ensure path starts with ./ for consistency (unless it's already relative or absolute)
  if (normalized && !normalized.startsWith('./') && !normalized.startsWith('../') && !normalized.startsWith('/')) {
    return './' + normalized;
  }
  return normalized;
};

const readIndex = async (indexPath: string): Promise<IndexEntry[]> => {
  try {
    const content = await readFile(indexPath, 'utf-8');
    if (!content) {
      return [];
    }
    const parsed = JSON.parse(content);
    // Handle migration from old format (object) to new format (array)
    if (Array.isArray(parsed)) {
      // Ensure all paths have ./ prefix
      return parsed.map((entry) => ({
        ...entry,
        path: normalizeRelativePath(entry.path),
      }));
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Convert old format to new format
      return Object.entries(parsed).map(([path, hash]) => ({
        path: normalizeRelativePath(path),
        hash: hash as string,
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
};
