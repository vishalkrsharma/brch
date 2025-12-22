import { Command } from 'commander';

export const logCommand = new Command('log').description('Display commit history').action(() => {
  console.log('Log command');
});
