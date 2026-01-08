import { Command } from 'commander';
import { status } from '../services/statusService';

export const statusCommand = new Command('status')
  .description('Show the working tree status')
  .addHelpText(
    'after',
    `
Examples:
  $ brch status

Displays:
  - Changes to be committed (staged files)
  - Changes not staged for commit (modified tracked files)
  - Untracked files (new files not yet added)

Use 'brch add <file>...' to stage files for commit.
`
  )
  .action(async () => {
    status();
  });
