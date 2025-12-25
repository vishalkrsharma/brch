import { Command } from 'commander';
import { log } from '../services/logService';

export const logCommand = new Command('log').description('Display commit history').action(log);
