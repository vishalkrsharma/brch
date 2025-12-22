import fs from 'fs/promises';

import { GLOBAL_CONFIG_PATH, HEAD_PATH, INDEX_PATH, LOCAL_CONFIG_PATH, OBJECTS_PATH } from '../utils/constants';
import { parse } from 'ini';
import { hashContent } from '../utils/hash';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { getObjectPath } from '../utils/objectPath';
import chalk from 'chalk';

export const commitChanges = async (message: string) => {
  try {
    const userData = await getUserData();
    const indexEntries = await readIndex(INDEX_PATH);

    const parentCommit = await getCurrentHead();

    const commitData = {
      timeStamp: new Date().toISOString(),
      message,
      files: indexEntries,
      parent: parentCommit,
      author: {
        name: userData.user.name,
        email: userData.user.email,
      },
    };

    const commitHash = hashContent(JSON.stringify(commitData));
    const repoRoot = process.cwd();
    const objectsDir = path.join(repoRoot, OBJECTS_PATH);
    const { objectDir, objectPath } = getObjectPath(commitHash, objectsDir);

    await mkdir(objectDir, { recursive: true });
    await writeFile(objectPath, JSON.stringify(commitData));
    await writeFile(HEAD_PATH, commitHash);
    await writeFile(INDEX_PATH, JSON.stringify([]));

    console.log(`Commit successfully created: ${commitHash}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.red('Error creating commit:'), message);

    process.exit(1);
  }
};

const normalizeRelativePath = (pathValue: string): string => {
  const normalized = pathValue.split('\\').join('/');
  // Ensure path starts with ./ for consistency (unless it's already relative or absolute)
  if (normalized && !normalized.startsWith('./') && !normalized.startsWith('../') && !normalized.startsWith('/')) {
    return './' + normalized;
  }
  return normalized;
};

const readIndex = async (indexPath: string) => {
  try {
    const content = await fs.readFile(indexPath, 'utf-8');
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

const getUserData = async () => {
  const readConfigFile = async (configPath: string) => {
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      return parse(configData);
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  };

  const localConfig = await readConfigFile(LOCAL_CONFIG_PATH);
  if (localConfig) {
    return localConfig;
  }

  const globalConfig = await readConfigFile(GLOBAL_CONFIG_PATH);
  if (globalConfig) {
    return globalConfig;
  }

  throw new Error('No config file found');
};

const getCurrentHead = async () => {
  try {
    return await fs.readFile(HEAD_PATH, 'utf-8');
  } catch (error) {
    return null;
  }
};
