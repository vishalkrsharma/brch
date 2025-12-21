import { initRepo } from '../services/initService';
import { Command } from 'commander';

export const initCommand = new Command('init')
  .description('Initialize a new brch repository in the current directory')
  .addHelpText(
    'after',
    `
Examples:
  $ brch init

This command creates a .brch directory with the necessary structure for version control.
The repository will track changes in the current directory and its subdirectories.
`
  )
  .action(initRepo);
