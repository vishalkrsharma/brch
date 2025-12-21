import { setConfig } from '../services/configService';
import { Command } from 'commander';

export const configCommand = new Command('config')
  .description('Manage repository or global configuration settings')
  .option('--global', 'Set global configuration (applies to all repositories)')
  .addHelpText(
    'after',
    `
Examples:
  $ brch config set user.name "John Doe"              Set local config
  $ brch config set user.email "john@example.com" --global  Set global config

Configuration is stored in:
  - Local: .brch/config (repository-specific)
  - Global: ~/.brchconfig (applies to all repositories)

Common configuration keys:
  - user.name: Your name
  - user.email: Your email address
`
  )
  .addCommand(
    new Command('set')
      .argument('<scopeKey>', 'Configuration key (e.g. user.name)')
      .argument('<value>', 'Configuration value')
      .description('Set a configuration value')
      .addHelpText(
        'after',
        `
Examples:
  $ brch config set user.name "John Doe"
  $ brch config set user.email "john@example.com" --global
`
      )
      .action(async function (scopeKey, value) {
        await setConfig({ scopeKey, value, isGlobal: this.parent?.opts().global ?? false });
      })
  );
