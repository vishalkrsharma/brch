import { join } from 'node:path';

/**
 * Generates object directory and file paths from a hash.
 * Uses a two-level directory structure: objectsDir/hash[0:2]/hash[2:]
 *
 * @param hash - The hash string (typically SHA-1)
 * @param objectsDir - The base objects directory path
 * @returns An object containing objectDir and objectPath
 */
export const getObjectPath = (hash: string, objectsDir: string): { objectDir: string; objectPath: string } => {
  const objectDir = join(objectsDir, hash.slice(0, 2));
  const objectPath = join(objectDir, hash.slice(2));
  return { objectDir, objectPath };
};
