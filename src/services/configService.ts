import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import { stringify, parse } from 'ini';
import { LOCAL_CONFIG_PATH, GLOBAL_CONFIG_PATH, VCS_DIR } from '../utils/constants';

export const setConfig = async ({ scopeKey, value, isGlobal }: { scopeKey: string; value: string; isGlobal: boolean }): Promise<void> => {
  try {
    const configPath = isGlobal ? GLOBAL_CONFIG_PATH : LOCAL_CONFIG_PATH;

    if (!isGlobal && !existsSync(VCS_DIR)) {
      console.log(
        chalk.red(
          'No local configuration file found. Run `brch config set --global <scopeKey> <value>` to set global configuration or run `brch init` to initialize a new repository.'
        )
      );
      process.exit(1);
    }

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
  } catch (error) {
    console.error(chalk.red(`Failed to set configuration: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
};

export const readConfigFile = ({ isGlobal }: { isGlobal: boolean }) => {
  try {
    return readFileSync(isGlobal ? GLOBAL_CONFIG_PATH : LOCAL_CONFIG_PATH, {
      encoding: 'utf-8',
    });
  } catch (error) {
    console.error(chalk.red(`Failed to read config file: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
};
