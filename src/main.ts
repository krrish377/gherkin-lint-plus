#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import * as linter from './linter.js';
import * as featureFinder from './feature-finder.js';
import * as configParser from './config-parser.js';
import * as logger from './logger.js';
import { printResults } from './formatters/stylish.js';
import type { LinterConfiguration } from './types.js';

export function list(val: string): string[] {
  return val.split(',');
}

export function collect(val: string, memo: string[]): string[] {
  memo.push(val);
  return memo;
}

export function getExitCode(results: { errors: unknown[] }[]): number {
  for (const result of results) {
    if (result.errors.length > 0) {
      return 1;
    }
  }
  return 0;
}

function defaultThisScriptPath(): string {
  return fileURLToPath(import.meta.url);
}

/**
 * True when this module is the script Node was asked to run (not when imported under Vitest, etc.).
 * Compares canonical paths (`realpathSync`) so pnpm-style symlinks under `node_modules` still match.
 * `resolveThisScript` is only for tests (e.g. simulate `fileURLToPath` failure).
 */
export function isCliEntrypoint(resolveThisScript: () => string = defaultThisScriptPath): boolean {
  const invoked = process.argv[1];
  if (!invoked) {
    return false;
  }
  try {
    const mainPath = resolveThisScript();
    const a = realpathSync(path.resolve(invoked));
    const b = realpathSync(path.resolve(mainPath));
    return a === b;
  } catch {
    return false;
  }
}

/** Resolves exit code from `run` (default `runCli`) and terminates the process. */
export function attachCliProcessExit(
  argv: string[] = process.argv,
  runImpl: (argv: string[]) => Promise<number> = runCli
): void {
  runImpl(argv).then(
    (code) => process.exit(code),
    (err: unknown) => {
      logger.boldError(String(err));
      process.exit(1);
    }
  );
}

/** Parse argv and run the linter; returns a process exit code (does not call `process.exit`). */
export async function runCli(argv: string[]): Promise<number> {
  const program = new Command();

  program
    .usage('[options] <feature-files>')
    .option(
      '-f, --format [format]',
      'output format (stylish is supported; json/xunit not yet)'
    )
    .option(
      '-i, --ignore <items>',
      `comma-separated ignore globs (overrides ${featureFinder.defaultIgnoreFileName})`,
      list
    )
    .option(
      '-c, --config [config]',
      `configuration file (default: ${configParser.defaultConfigFileName})`
    )
    .option('-r, --rulesdir <dir>', 'additional rule directories', collect, [] as string[])
    .argument('[files...]', 'feature files, directories, or globs');

  program.parse(argv, { from: 'node' });

  const options = program.opts<{
    format?: string;
    ignore?: string[];
    config?: string;
    rulesdir: string[];
  }>();
  const additionalRulesDirs = options.rulesdir ?? [];

  const files = featureFinder.getFeatureFiles(program.args as string[], options.ignore);

  let config: LinterConfiguration;
  try {
    config = configParser.getConfiguration(options.config, additionalRulesDirs);
  } catch (e) {
    logger.boldError(String(e));
    return 1;
  }

  try {
    const results = await linter.lint(files, config, additionalRulesDirs);
    const format = options.format;
    if (format === 'json' || format === 'xunit') {
      logger.boldError(
        'Unsupported format. Only stylish is implemented in gherkin-lint-plus for now.'
      );
      return 1;
    }
    if (!format || format === 'stylish') {
      printResults(results);
    }
    return getExitCode(results);
  } catch (err: unknown) {
    logger.boldError(String(err));
    return 1;
  }
}

export type CliEntrypointDeps = {
  isEntrypoint: () => boolean;
  attachProcessExit: () => void;
};

const defaultEntrypointDeps: CliEntrypointDeps = {
  isEntrypoint: () => isCliEntrypoint(),
  attachProcessExit: () => attachCliProcessExit(),
};

export function runCliEntrypointIfNeeded(deps: CliEntrypointDeps = defaultEntrypointDeps): void {
  if (deps.isEntrypoint()) {
    deps.attachProcessExit();
  }
}

runCliEntrypointIfNeeded();
