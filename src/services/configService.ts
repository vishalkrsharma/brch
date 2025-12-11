import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import { stringify, parse } from 'ini';
import { VCS_CONFIG, GLOBAL_CONFIG_PATH } from '../utils/constants';

export const setConfig = async ({ scopeKey, value, isGlobal }: { scopeKey: string; value: string; isGlobal: boolean }): Promise<void> => {
  const configPath = isGlobal ? GLOBAL_CONFIG_PATH : VCS_CONFIG;

  // Check if file exists, create it if it doesn't
  if (!existsSync(configPath)) {
    writeFileSync(configPath, '');
  }

  const configFileContent = readConfigFile({ isGlobal });
  const configFileJson = parse(configFileContent || '');

  const scopeKeyAttrs = scopeKey.split('.');

  const scope = scopeKeyAttrs[0];
  const key = scopeKeyAttrs[1];

  // Initialize scope if it doesn't exist
  if (!configFileJson[scope!]) {
    configFileJson[scope!] = {};
  }

  configFileJson[scope!][key!] = value;

  const configFileString = stringify(configFileJson);

  writeFileSync(configPath, configFileString);

  console.log(chalk.green('Configuration set successfully.'));
};

export const readConfigFile = ({ isGlobal }: { isGlobal: boolean }) => {
  return readFileSync(isGlobal ? GLOBAL_CONFIG_PATH : VCS_CONFIG, {
    encoding: 'utf-8',
  });
};
