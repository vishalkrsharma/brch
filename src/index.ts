#!/usr/bin/env node

import { program } from 'commander';
import { registerCommands } from './commands';
import { VCS_NAME } from './utils/constants';

program.name(VCS_NAME).description('A simple VCS').version('0.0.1');

registerCommands(program);

program.parse(process.argv);
