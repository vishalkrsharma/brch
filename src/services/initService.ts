import chalk from 'chalk';
import { mkdirSync, writeFileSync } from 'fs';
import { VCS_DIR, HEAD_FILE, OBJECTS_DIR } from '../utils/constants';

export const initRepo = async (): Promise<void> => {
  try {
    mkdirSync(VCS_DIR);
    mkdirSync(OBJECTS_DIR);

    writeFileSync(HEAD_FILE, 'ref: refs/heads/master');

    console.log('Initialized empty ' + chalk.green('brch') + ' repository in ' + chalk.green(process.cwd() + '/' + VCS_DIR));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      console.log(chalk.red('brch repository already initialized.'));
    }

    console.error('Error initializing repository:', error);
    process.exit(1);
  }
};
