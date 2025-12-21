import { Command } from 'commander';
import chalk from 'chalk';
import { addFiles } from '../services/addService';

export const addCommand = new Command('add')
  .argument('<paths...>', 'Files or directories to add to staging (supports "." for current directory)')
  .description('Add files to the staging area for the next commit')
  .addHelpText(
    'after',
    `
Examples:
  $ brch add file.txt              Stage a single file
  $ brch add src/                  Stage all files in src directory
  $ brch add .                     Stage all files in current directory
  $ brch add file1.txt file2.js    Stage multiple files

The add command stages files for commit. Files that haven't changed since the last
commit will be skipped. Only files that exist and have been modified will be staged.
`
  )
  .action(async (paths: string[]) => {
    const targets = paths;

    console.log('TARGETS', targets);

    try {
      const { staged, skipped } = await addFiles(targets);

      if (staged.length > 0) {
        console.log(chalk.green('Staged:'));
        staged.forEach((path) => console.log(` - ${path}`));
      }

      if (skipped.length > 0) {
        console.log(chalk.yellow('Skipped (unchanged or not found):'));
        skipped.forEach((path) => console.log(` - ${path}`));
      }

      if (staged.length === 0 && skipped.length === 0) {
        console.log(chalk.yellow('Nothing to add.'));
      }
    } catch (error) {
      console.error(chalk.red((error as Error).message));
      process.exitCode = 1;
    }
  });
