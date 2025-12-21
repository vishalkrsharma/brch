import chalk from 'chalk';
import { mkdir, writeFile } from 'fs/promises';
import { VCS_DIR, HEAD_FILE, OBJECTS_PATH } from '../utils/constants';

export const initRepo = async (): Promise<void> => {
  try {
    await mkdir(VCS_DIR, { recursive: true });
    await mkdir(OBJECTS_PATH, { recursive: true });

    await writeFile(HEAD_FILE, 'ref: refs/heads/master');

    console.log('Initialized empty ' + chalk.green('brch') + ' repository in ' + chalk.green(process.cwd() + '/' + VCS_DIR));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      console.log(chalk.red('brch repository already initialized.'));
    }

    console.error('Error initializing repository:', error);
    process.exit(1);
  }
};
