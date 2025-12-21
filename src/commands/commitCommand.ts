import { Command } from 'commander';
import { commitChanges } from '../services/commitService';

export const commitCommand = new Command('commit')
  .description('Commit changes to the repository')
  .option('-m, --message <message>', 'Commit message')
  .action(commitChanges);
