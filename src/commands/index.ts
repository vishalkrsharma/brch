import { configCommand } from './configCommand';
import { Command } from 'commander';
import { initCommand } from './initCommand';
import { addCommand } from './addCommand';
import { commitCommand } from './commitCommand';
import { logCommand } from './logCommand';

export const registerCommands = (program: Command) => {
  program.addCommand(configCommand);
  program.addCommand(initCommand);
  program.addCommand(addCommand);
  program.addCommand(commitCommand);
  program.addCommand(logCommand);
};
