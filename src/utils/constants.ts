import { homedir } from 'os';

export const VCS_NAME = 'brch';

export const VCS_DIR = '.brch';
export const VCS_PATH = `${process.cwd()}/${VCS_DIR}`;

export const OBJECTS_PATH = `${VCS_DIR}/objects`;
export const REFS_PATH = `${VCS_DIR}/refs`;
export const REFS_HEAD_PATH = `${REFS_PATH}/heads`;

export const HEAD_FILE = 'HEAD';
export const HEAD_PATH = `${VCS_DIR}/HEAD`;

export const GLOBAL_CONFIG_FILE = '.brchconfig';
export const HOME_DIR = homedir();
export const GLOBAL_CONFIG_PATH = `${HOME_DIR}/${GLOBAL_CONFIG_FILE}`;
export const LOCAL_CONFIG_FILE = 'config';
export const LOCAL_CONFIG_PATH = `${process.cwd()}/${VCS_DIR}/${LOCAL_CONFIG_FILE}`;

export const INDEX_FILE = 'index.json';
export const INDEX_PATH = `${process.cwd()}/${VCS_DIR}/${INDEX_FILE}`;

export const IGNORE_FILE = '.brchignore';
export const IGNORE_PATH = `${process.cwd()}/${VCS_DIR}/${IGNORE_FILE}`;
