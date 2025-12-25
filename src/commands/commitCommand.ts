import { Command } from 'commander';
import { commitChanges } from '../services/commitService';

export const commitCommand = new Command('commit')
  .description('Commit staged changes to the repository')
  .option('-m, --message <message>', 'Commit message describing the changes')
  .addHelpText(
    'after',
    `
Examples:
  $ brch commit -m "Add new feature"     Commit with a message
  $ brch commit --message "Fix bug"      Commit with a message (alternative syntax)

The commit command creates a new commit with all currently staged files. You must
provide a commit message using the -m or --message option. Only staged files will
be included in the commit.
`
  )
  .action(async (options: { message: string }) => {
    commitChanges(options.message);
  });
