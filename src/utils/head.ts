import fs from 'fs/promises';
import path from 'path';
import { HEAD_PATH, REFS_HEAD_PATH } from './constants';

export const getCurrentBranchName = async (): Promise<string | null> => {
  try {
    const headContent = await fs.readFile(HEAD_PATH, 'utf-8');
    const headContentTrimmed = headContent.trim();

    // Check if HEAD points to a ref (e.g., "ref: refs/heads/master")
    if (headContentTrimmed.startsWith('ref: ')) {
      const refPath = headContentTrimmed.substring(5).trim(); // Remove "ref: " prefix
      // Extract branch name from ref path (e.g., "refs/heads/master" -> "master")
      return refPath.replace('refs/heads/', '');
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const getCurrentHead = async () => {
  try {
    const headContent = await fs.readFile(HEAD_PATH, 'utf-8');
    const headContentTrimmed = headContent.trim();

    // Check if HEAD points to a ref (e.g., "ref: refs/heads/master")
    if (headContentTrimmed.startsWith('ref: ')) {
      const refPath = headContentTrimmed.substring(5).trim(); // Remove "ref: " prefix

      // Extract branch name from ref path (e.g., "refs/heads/master" -> "master")
      const branchName = refPath.replace('refs/heads/', '');
      const branchRefPath = path.join(process.cwd(), REFS_HEAD_PATH, branchName);

      try {
        const commitHash = await fs.readFile(branchRefPath, 'utf-8');
        return commitHash.trim();
      } catch (error) {
        // Branch ref file doesn't exist yet
        return null;
      }
    }

    // Legacy: HEAD directly contains commit hash (for backward compatibility)
    return headContentTrimmed;
  } catch (error) {
    return null;
  }
};
