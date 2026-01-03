import { Command } from 'commander';
import { status } from '../services/statusService';

export const statusCommand = new Command('status').description('Show the working tree status').action(async () => {
  status();
});
