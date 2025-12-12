import { homedir } from 'os';

export const VCS_NAME = 'brch';

export const VCS_DIR = '.brch';

export const OBJECT_DIR = `${VCS_DIR}/objects`;
export const HEAD_FILE = `${VCS_DIR}/HEAD`;

export const GLOBAL_VCS_CONFIG = '.brchconfig';
export const HOME_DIR = homedir();
export const GLOBAL_CONFIG_PATH = `${HOME_DIR}/${GLOBAL_VCS_CONFIG}`;
export const LOCAL_VCS_CONFIG = 'config';
export const LOCAL_CONFIG_PATH = `${process.cwd()}/${VCS_DIR}/${LOCAL_VCS_CONFIG}`;

export const INDEX_FILE = 'index.json';
