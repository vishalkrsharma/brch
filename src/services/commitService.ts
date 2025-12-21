import fs from 'fs/promises';

import { GLOBAL_CONFIG_PATH, HEAD_PATH, INDEX_PATH, LOCAL_CONFIG_PATH, OBJECTS_PATH } from '../utils/constants';
import { parse } from 'ini';
import { hashContent } from '../utils/hash';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { getObjectPath } from '../utils/objectPath';

export const commitChanges = async (message: string) => {
  try {
    console.log('message', message);
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
    console.log(message);

    process.exit(1);
  }
};

const readIndex = async (indexPath: string) => {
  const indexEntries = await fs.readFile(indexPath, 'utf-8');
  return JSON.parse(indexEntries);
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
