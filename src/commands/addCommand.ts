import { Command } from 'commander';
import chalk from 'chalk';
import { addFiles } from '../services/addService';

export const addCommand = new Command('add')
  .argument('<paths...>', 'Files or directories to add to staging (supports "." for current directory)')
  .description('Add files to the staging area')
  .action(async (paths: string[]) => {
    const targets = paths;

    try {
      const { staged, skipped } = await addFiles(targets);

      if (staged.length > 0) {
        console.log(chalk.green('Staged:'));
        staged.forEach((path) => console.log(`  ${path}`));
      }

      if (skipped.length > 0) {
        console.log(chalk.yellow('Skipped (unchanged or not found):'));
        skipped.forEach((path) => console.log(`  ${path}`));
      }

      if (staged.length === 0 && skipped.length === 0) {
        console.log(chalk.yellow('Nothing to add.'));
      }
    } catch (error) {
      console.error(chalk.red((error as Error).message));
      process.exitCode = 1;
    }
  });
