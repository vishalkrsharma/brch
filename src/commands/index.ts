import { configCommand } from './configCommand';
import { Command } from 'commander';
import { initCommand } from './initCommand';
import { addCommand } from './addCommand';
import { commitCommand } from './commitCommand';
import { logCommand } from './logCommand';
import { statusCommand } from './statusCommand';
import { diffCommand } from './diffCommand';

export const registerCommands = (program: Command) => {
  program.addCommand(configCommand);
  program.addCommand(initCommand);
  program.addCommand(addCommand);
  program.addCommand(commitCommand);
  program.addCommand(logCommand);
  program.addCommand(statusCommand);
  program.addCommand(diffCommand);
};
