import { initRepo } from '../services/initService';
import { Command } from 'commander';

export const initCommand = new Command('init').description('Initialize a new repository').action(async () => {
  initRepo();
});
