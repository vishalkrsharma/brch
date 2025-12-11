import { configCommand } from './configCommand';
import { Command } from 'commander';
import { initCommand } from './initCommand';

export const registerCommands = (program: Command) => {
  program.addCommand(configCommand);
  program.addCommand(initCommand);
};
