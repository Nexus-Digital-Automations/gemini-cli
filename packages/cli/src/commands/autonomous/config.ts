/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

interface ConfigOptions {
  get?: string;
  set?: string;
  list?: boolean;
  reset?: string;
  value?: string;
}

interface SystemConfig {
  persistenceConfig: {
    type: 'file' | 'memory';
    path: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    output: 'console' | 'file';
  };
  agentConfig: {
    maxConcurrentAgents: number;
    heartbeatInterval: number;
    sessionTimeout: number;
  };
  qualityConfig: {
    enableLinting: boolean;
    enableTesting: boolean;
    enableSecurity: boolean;
    enablePerformance: boolean;
  };
  featureConfig: {
    featuresFilePath: string;
    requireApproval: boolean;
    autoRejectTimeout: number;
  };
  monitoring: {
    enableMetrics: boolean;
    metricsInterval: number;
    alertThresholds: {
      taskQueueSize: number;
      avgExecutionTime: number;
      failureRate: number;
    };
  };
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SystemConfig = {
  persistenceConfig: {
    type: 'file',
    path: './data/autonomous-tasks.json',
  },
  logging: {
    level: 'info',
    output: 'console',
  },
  agentConfig: {
    maxConcurrentAgents: 10,
    heartbeatInterval: 30000,
    sessionTimeout: 300000,
  },
  qualityConfig: {
    enableLinting: true,
    enableTesting: true,
    enableSecurity: true,
    enablePerformance: true,
  },
  featureConfig: {
    featuresFilePath: './FEATURES.json',
    requireApproval: true,
    autoRejectTimeout: 604800000,
  },
  monitoring: {
    enableMetrics: true,
    metricsInterval: 60000,
    alertThresholds: {
      taskQueueSize: 100,
      avgExecutionTime: 300000,
      failureRate: 0.1,
    },
  },
};

const CONFIG_FILE_PATH = path.join(
  process.cwd(),
  '.gemini-autonomous-config.json',
);

function loadConfig(): SystemConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn(
      chalk.yellow(
        `Warning: Could not load config file. Using defaults. Error: ${error}`,
      ),
    );
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: SystemConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    console.log(chalk.green('✅ Configuration saved successfully!'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to save configuration:'));
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}

function getConfigValue(config: SystemConfig, key: string): unknown {
  const keys = key.split('.');
  let value: unknown = config;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }

  return value;
}

function setConfigValue(
  config: SystemConfig,
  key: string,
  value: string,
): SystemConfig {
  const keys = key.split('.');
  const newConfig = JSON.parse(JSON.stringify(config));
  let current: Record<string, unknown> = newConfig as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current)) {
      current[k] = {};
    }
    current = current[k] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];

  // Try to parse as JSON for complex values
  try {
    current[lastKey] = JSON.parse(value);
  } catch {
    // If parsing fails, treat as string
    current[lastKey] = value;
  }

  return newConfig;
}

function resetConfigValue(config: SystemConfig, key: string): SystemConfig {
  const defaultValue = getConfigValue(DEFAULT_CONFIG, key);
  if (defaultValue !== undefined) {
    return setConfigValue(config, key, JSON.stringify(defaultValue));
  }
  return config;
}

function printConfigTree(obj: Record<string, unknown>, prefix = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      console.log(chalk.cyan(`${fullKey}:`));
      printConfigTree(value as Record<string, unknown>, fullKey);
    } else {
      console.log(`  ${fullKey}: ${chalk.green(JSON.stringify(value))}`);
    }
  }
}

export const configCommand: CommandModule<object, ConfigOptions> = {
  command: 'config',
  describe: 'Configure autonomous task management system settings',
  builder: (yargs) =>
    yargs
      .option('get', {
        type: 'string',
        describe:
          'Get a configuration value by key (e.g., "agentConfig.maxConcurrentAgents")',
        alias: 'g',
      })
      .option('set', {
        type: 'string',
        describe: 'Set a configuration key (use with --value)',
        alias: 's',
      })
      .option('value', {
        type: 'string',
        describe: 'Value to set for the specified key',
        alias: 'v',
      })
      .option('list', {
        type: 'boolean',
        describe: 'List all configuration settings',
        alias: 'l',
      })
      .option('reset', {
        type: 'string',
        describe: 'Reset a configuration key to default value',
        alias: 'r',
      })
      .example(
        'gemini autonomous config --list',
        'Show all configuration settings',
      )
      .example(
        'gemini autonomous config --get agentConfig.maxConcurrentAgents',
        'Get max agents setting',
      )
      .example(
        'gemini autonomous config --set agentConfig.maxConcurrentAgents --value 20',
        'Set max agents to 20',
      )
      .example(
        'gemini autonomous config --reset agentConfig.maxConcurrentAgents',
        'Reset max agents to default',
      )
      .check((argv) => {
        if (argv.set && !argv.value) {
          throw new Error('--value is required when using --set');
        }
        return true;
      }),

  handler: async (argv) => {
    try {
      const config = loadConfig();

      if (argv.list) {
        console.log(
          chalk.cyan('🔧 Autonomous Task Management System Configuration:'),
        );
        console.log('');
        printConfigTree(config);
        console.log('');
        console.log(chalk.gray(`Configuration file: ${CONFIG_FILE_PATH}`));
        return;
      }

      if (argv.get) {
        const value = getConfigValue(config, argv.get);
        if (value !== undefined) {
          console.log(
            chalk.green(`${argv.get}: ${JSON.stringify(value, null, 2)}`),
          );
        } else {
          console.error(
            chalk.red(`❌ Configuration key "${argv.get}" not found.`),
          );
          process.exit(1);
        }
        return;
      }

      if (argv.set && argv.value) {
        try {
          const newConfig = setConfigValue(config, argv.set, argv.value);
          saveConfig(newConfig);
          console.log(
            chalk.green(
              `✅ Set ${argv.set} = ${JSON.stringify(JSON.parse(argv.value))}`,
            ),
          );
        } catch (error) {
          console.error(chalk.red('❌ Failed to set configuration:'));
          console.error(
            chalk.red(error instanceof Error ? error.message : String(error)),
          );
          process.exit(1);
        }
        return;
      }

      if (argv.reset) {
        try {
          const newConfig = resetConfigValue(config, argv.reset);
          saveConfig(newConfig);
          const resetValue = getConfigValue(newConfig, argv.reset);
          console.log(
            chalk.green(
              `✅ Reset ${argv.reset} to default: ${JSON.stringify(resetValue)}`,
            ),
          );
        } catch (error) {
          console.error(chalk.red('❌ Failed to reset configuration:'));
          console.error(
            chalk.red(error instanceof Error ? error.message : String(error)),
          );
          process.exit(1);
        }
        return;
      }

      // If no specific option provided, show help
      console.log(
        chalk.yellow(
          'Please specify an action. Use --help for available options.',
        ),
      );
      console.log('');
      console.log(chalk.cyan('Common commands:'));
      console.log(
        '  gemini autonomous config --list                    # List all settings',
      );
      console.log(
        '  gemini autonomous config --get <key>               # Get a setting',
      );
      console.log(
        '  gemini autonomous config --set <key> --value <val> # Set a setting',
      );
      console.log(
        '  gemini autonomous config --reset <key>             # Reset to default',
      );
    } catch (error) {
      console.error(chalk.red('❌ Configuration command failed:'));
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error)),
      );
      process.exit(1);
    }
  },
};
