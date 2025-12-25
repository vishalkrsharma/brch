import chalk from 'chalk';
import { getCurrentBranchName, getCurrentHead } from '../utils/head';
import fs from 'fs/promises';
import path from 'path';
import { OBJECTS_PATH } from '../utils/constants';
import { formatDateLog } from '../utils/date';

export const log = async (options?: { limit?: string }) => {
  try {
    const currentBranch = await getCurrentBranchName();
    let currentCommitHash = await getCurrentHead();
    const limit = options?.limit ? parseInt(options.limit, 10) : undefined;
    let commitCount = 0;

    console.log(currentCommitHash);

    while (currentCommitHash && (!limit || commitCount < limit)) {
      commitCount++;
      const commitData = JSON.parse(await fs.readFile(path.join(OBJECTS_PATH, currentCommitHash.substring(0, 2), currentCommitHash.substring(2)), 'utf-8'));

      console.log(
        chalk.yellow(
          `commit ${currentCommitHash} (` +
            chalk.cyan.bold('HEAD') +
            chalk.yellow(` -> `) +
            chalk.green.bold(currentBranch) +
            chalk.yellow(', ') +
            chalk.redBright.bold(`origin/${currentBranch}`) +
            chalk.yellow(', ') +
            chalk.redBright.bold('origin/HEAD') +
            chalk.yellow(')')
        )
      );
      console.log(`Author: ${commitData.author.name} <${commitData.author.email}>`);
      console.log(`Date: ${formatDateLog(commitData.timeStamp)}`);
      console.log(`\n\t${commitData.message}\n`);

      if (!limit || commitCount < limit) {
        currentCommitHash = commitData.parent;
      } else {
        currentCommitHash = null;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.red('Error logging:'), message);

    process.exit(1);
  }
};
