import { setConfig } from '../services/configService';
import { Command } from 'commander';

export const configCommand = new Command('config')
  .description('Manage repository or global configuration')
  .option('--global', 'Set global configuration')
  .addCommand(
    new Command('set')

      .argument('<scopeKey>', 'Configuration key (e.g. user.name)')
      .argument('<value>', 'Configuration value')
      .description('Set a configuration value')
      .action(async function (scopeKey, value) {
        await setConfig({ scopeKey, value, isGlobal: this.parent?.opts().global ?? false });
      })
  );
