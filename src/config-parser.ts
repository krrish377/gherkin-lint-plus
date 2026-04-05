import { readFileSync, existsSync } from 'node:fs';
import stripJsonComments from 'strip-json-comments';
import * as logger from './logger.js';
import { verifyConfigurationFile } from './config-verifier.js';
import type { LinterConfiguration } from './types.js';

export const defaultConfigFileName = '.gherkin-lintrc';

export function getConfiguration(
  configPath: string | undefined,
  additionalRulesDirs: string[]
): LinterConfiguration {
  let path: string;
  if (configPath) {
    if (!existsSync(configPath)) {
      logger.boldError(`Could not find specified config file "${configPath}"`);
      process.exit(1);
    }
    path = configPath;
  } else {
    if (!existsSync(defaultConfigFileName)) {
      logger.boldError(
        `Could not find default config file "${defaultConfigFileName}" in the working directory.\n` +
          'To use a custom name/path provide the config file using the "-c" arg.'
      );
      process.exit(1);
    }
    path = defaultConfigFileName;
  }

  const raw = readFileSync(path, { encoding: 'utf8' });
  const config = JSON.parse(stripJsonComments(raw)) as LinterConfiguration;
  const errors = verifyConfigurationFile(config, additionalRulesDirs);

  if (errors.length > 0) {
    logger.boldError('Error(s) in configuration file:');
    for (const err of errors) {
      logger.error(`- ${err}`);
    }
    process.exit(1);
  }

  return config;
}
