import { Command } from 'commander';
import { diff } from '../services/diffService';

export const diffCommand = new Command('diff')
  .description('Show changes between working directory and last commit')
  .argument('[files...]', 'Specific files to show differences for')
  .addHelpText(
    'after',
    `
Examples:
  $ brch diff                     Show changes for all modified files
  $ brch diff file.txt            Show changes for a specific file
  $ brch diff src/                Show changes for all files in a directory

Displays line-by-line differences between your current files and the last committed version.
Deleted lines are shown in red, and added lines are shown in green.
`
  )
  .action(async (files: string[]) => {
    await diff(files);
  });