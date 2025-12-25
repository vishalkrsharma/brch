import { Command } from 'commander';
import { log } from '../services/logService';

export const logCommand = new Command('log')
  .description('Show commit history for the current repository in reverse chronological order')
  .option('-L, --limit <number>', 'Limit the number of commits to display')
  .addHelpText('after', 'Displays each commit with author, date, and message. Use -L or --limit to restrict output to a specific number of commits.')
  .action(log);
