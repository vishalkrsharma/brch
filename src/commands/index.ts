import { configCommand } from './configCommand';
import { Command } from 'commander';
import { initCommand } from './initCommand';
import { addCommand } from './addCommand';

export const registerCommands = (program: Command) => {
  program.addCommand(configCommand);
  program.addCommand(initCommand);
  program.addCommand(addCommand);
};
