import chalk from 'chalk';
import { getCurrentBranchName, getCurrentHead } from '../utils/head';
import fs from 'fs/promises';
import path from 'path';
import { OBJECTS_PATH } from '../utils/constants';
import { formatDateLog } from '../utils/date';

export const log = async () => {
  try {
    const currentBranch = await getCurrentBranchName();
    let currentCommitHash = await getCurrentHead();

    console.log(currentCommitHash);

    while (currentCommitHash) {
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

      currentCommitHash = commitData.parent;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.red('Error logging:'), message);

    process.exit(1);
  }
};
