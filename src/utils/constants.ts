import { homedir } from 'os';

export const VCS_NAME = 'brch';

export const VCS_CONFIG = '.brchconfig';
export const HOME_DIR = homedir();
export const GLOBAL_CONFIG_PATH = `${HOME_DIR}/${VCS_CONFIG}`;

export const VCS_DIR = '.brch';
export const OBJECT_DIR = `${VCS_DIR}/objects`;
export const HEAD_FILE = `${VCS_DIR}/HEAD`;
