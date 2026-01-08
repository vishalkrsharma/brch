#!/usr/bin/env node

import { program } from 'commander';
import { registerCommands } from './commands';
import { VCS_NAME } from './utils/constants';

program
  .name(VCS_NAME)
  .description('brch - A simple version control system for tracking changes in your project')
  .version('0.0.1')
  .addHelpText(
    'after',
    `
Examples:
  $ brch init                    Initialize a new repository
  $ brch add .                   Stage all files in current directory
  $ brch status                  Show current repository status
  $ brch commit -m "Commit msg"  Commit staged changes
  $ brch log                     Show commit history
  $ brch diff                    Show changes in working tree
  $ brch config set user.name "John Doe"  Set configuration

For more information about a specific command, use:
  $ brch <command> --help
`
  );

registerCommands(program);

program.parse(process.argv);
