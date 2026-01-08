import { Command } from 'commander';
import { log } from '../services/logService';

export const logCommand = new Command('log')
  .description('Show commit history for the current repository in reverse chronological order')
  .option('-L, --limit <number>', 'Limit the number of commits to display')
  .addHelpText(
    'after',
    `
Examples:
  $ brch log                      Show all commits
  $ brch log -L 5                 Show the last 5 commits
  $ brch log --limit 10           Show the last 10 commits

Displays each commit with author, date, hash, and message.
Commits are shown from newest to oldest.
`
  )
  .action(log);
