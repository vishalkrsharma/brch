import chalk from 'chalk';
import { mkdirSync, writeFileSync } from 'fs';
import { VCS_DIR, HEAD_FILE, OBJECT_DIR } from '../utils/constants';

export const initRepo = async (): Promise<void> => {
  try {
    mkdirSync(VCS_DIR);
    mkdirSync(OBJECT_DIR);

    writeFileSync(HEAD_FILE, 'ref: refs/heads/master');

    console.log('Initialized empty ' + chalk.green('dlt') + ' repository in ' + chalk.green(process.cwd() + '/' + VCS_DIR));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      console.log(chalk.red('dlt repository already initialized.'));
      return;
    }

    console.error('Error initializing repository:', error);
  }
};
