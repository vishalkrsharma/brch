import { Command } from 'commander';
import { diff } from '../services/diffService';

export const diffCommand = new Command('diff')
  .description('Show changes between working directory and last commit')
  .action(async () => {
    await diff();
  });