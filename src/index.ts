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
  $ brch add file1.txt file2.js  Stage specific files
  $ brch commit -m "Initial commit"  Commit staged changes
  $ brch config set user.name "John Doe"  Set configuration
  $ brch config set user.email "john@example.com" --global  Set global configuration

For more information about a specific command, use:
  $ brch <command> --help
`
  );

registerCommands(program);

program.parse(process.argv);
