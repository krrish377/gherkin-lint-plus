import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import * as logger from './logger.js';

export const defaultIgnoreFileName = '.gherkin-lintignore';
const defaultIgnoredFiles = 'node_modules/**';

function getIgnorePatterns(ignoreArg: string[] | undefined): string | string[] {
  if (ignoreArg?.length) {
    return ignoreArg;
  }
  if (existsSync(defaultIgnoreFileName)) {
    return readFileSync(defaultIgnoreFileName, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line !== '');
  }
  return defaultIgnoredFiles;
}

export function getFeatureFiles(args: string[], ignoreArg: string[] | undefined): string[] {
  const patterns = args.length > 0 ? args : ['.'];
  const files: string[] = [];

  for (const pattern of patterns) {
    let fixedPattern: string | undefined;

    if (pattern === '.') {
      fixedPattern = '**/*.feature';
    } else if (/\/\*\*/.test(pattern)) {
      fixedPattern = `${pattern}/**/*.feature`;
    } else if (/\.feature$/.test(pattern)) {
      fixedPattern = pattern;
    } else {
      try {
        if (statSync(pattern).isDirectory()) {
          fixedPattern = path.join(pattern, '**/*.feature');
        }
      } catch {
        /* handled below */
      }
    }

    if (!fixedPattern) {
      logger.boldError(
        `Invalid format of the feature file path/pattern: "${pattern}".\n` +
          'To run the linter please specify an existing feature file, directory or glob.'
      );
      process.exit(1);
    }

    const matched = globSync(fixedPattern, {
      ignore: getIgnorePatterns(ignoreArg),
      nodir: true,
    });
    files.push(...matched);
  }

  return [...new Set(files)];
}
