import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import chalk from 'chalk';
import { stringify, parse } from 'ini';
import { LOCAL_CONFIG_PATH, GLOBAL_CONFIG_PATH, VCS_DIR } from '../utils/constants';
import { dirname } from 'path';

export const setConfig = async ({ scopeKey, value, isGlobal }: { scopeKey: string; value: string; isGlobal: boolean }): Promise<void> => {
  try {
    const configPath = isGlobal ? GLOBAL_CONFIG_PATH : LOCAL_CONFIG_PATH;

    if (!isGlobal) {
      try {
        await access(VCS_DIR, constants.F_OK);
      } catch {
        console.log(
          chalk.red(
            'No local configuration file found. Run `brch config set --global <scopeKey> <value>` to set global configuration or run `brch init` to initialize a new repository.'
          )
        );
        process.exit(1);
      }
    }

    // Check if file exists, create it if it doesn't
    try {
      await access(configPath, constants.F_OK);
    } catch {
      // Ensure directory exists before creating file
      await mkdir(dirname(configPath), { recursive: true });
      await writeFile(configPath, '');
    }

    const configFileContent = await readConfigFile({ isGlobal });
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

    await writeFile(configPath, configFileString);

    console.log(chalk.green('Configuration set successfully.'));
  } catch (error) {
    console.error(chalk.red(`Failed to set configuration: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
};

export const readConfigFile = async ({ isGlobal }: { isGlobal: boolean }): Promise<string> => {
  try {
    return await readFile(isGlobal ? GLOBAL_CONFIG_PATH : LOCAL_CONFIG_PATH, {
      encoding: 'utf-8',
    });
  } catch (error) {
    console.error(chalk.red(`Failed to read config file: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
};
