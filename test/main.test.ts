import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as linter from '../src/linter.js';
import * as logger from '../src/logger.js';
import * as stylish from '../src/formatters/stylish.js';
import {
  attachCliProcessExit,
  collect,
  getExitCode,
  isCliEntrypoint,
  list,
  runCli,
  runCliEntrypointIfNeeded,
} from '../src/main.js';
import { invalidateRulesMapCache } from '../src/rules/registry.js';

describe('main helpers', () => {
  it('list splits on comma', () => {
    expect(list('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('collect appends to memo', () => {
    const memo: string[] = [];
    expect(collect('a', memo)).toBe(memo);
    expect(collect('b', memo)).toBe(memo);
    expect(memo).toEqual(['a', 'b']);
  });

  it('getExitCode is 0 when no errors', () => {
    expect(getExitCode([{ errors: [] }])).toBe(0);
  });

  it('getExitCode is 1 when any file has errors', () => {
    expect(
      getExitCode([
        { errors: [] },
        { errors: [{ rule: 'x', message: 'm', line: 1 }] },
      ])
    ).toBe(1);
  });
});

describe('runCli', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'boldError').mockImplementation(() => {});
    vi.spyOn(stylish, 'printResults').mockImplementation(() => {});
  });

  afterEach(() => {
    invalidateRulesMapCache();
    vi.restoreAllMocks();
  });

  function tempProject(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), 'gherkin-main-'));
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(dir, name), content, 'utf8');
    }
    return dir;
  }

  it('returns 0 for a clean feature with minimal config', async () => {
    const dir = tempProject({
      '.gherkin-lintrc': '{}',
      'ok.feature': `Feature: F
Scenario: S
  Given x
`,
    });
    const code = await runCli([
      'node',
      'cli',
      '-c',
      join(dir, '.gherkin-lintrc'),
      join(dir, 'ok.feature'),
    ]);
    expect(code).toBe(0);
  });

  it('returns 1 when config JSON is invalid', async () => {
    const dir = tempProject({
      '.gherkin-lintrc': '{ not json',
      'x.feature': `Feature: F
Scenario: S
  Given x
`,
    });
    const code = await runCli([
      'node',
      'cli',
      '-c',
      join(dir, '.gherkin-lintrc'),
      join(dir, 'x.feature'),
    ]);
    expect(code).toBe(1);
  });

  it('returns 1 for unsupported format option', async () => {
    const dir = tempProject({
      '.gherkin-lintrc': '{}',
      'x.feature': `Feature: F
Scenario: S
  Given x
`,
    });
    const code = await runCli([
      'node',
      'cli',
      '-c',
      join(dir, '.gherkin-lintrc'),
      '-f',
      'json',
      join(dir, 'x.feature'),
    ]);
    expect(code).toBe(1);
  });

  it('returns 1 for xunit format option', async () => {
    const dir = tempProject({
      '.gherkin-lintrc': '{}',
      'x.feature': `Feature: F
Scenario: S
  Given x
`,
    });
    const code = await runCli([
      'node',
      'cli',
      '-c',
      join(dir, '.gherkin-lintrc'),
      '-f',
      'xunit',
      join(dir, 'x.feature'),
    ]);
    expect(code).toBe(1);
  });

  it('does not use stylish formatter for an unknown format name', async () => {
    const dir = tempProject({
      '.gherkin-lintrc': '{}',
      'x.feature': `Feature: F
Scenario: S
  Given x
`,
    });
    const code = await runCli([
      'node',
      'cli',
      '-c',
      join(dir, '.gherkin-lintrc'),
      '-f',
      'unknown-format',
      join(dir, 'x.feature'),
    ]);
    expect(stylish.printResults).not.toHaveBeenCalled();
    expect(code).toBe(0);
  });

  it('returns 1 when lint reports errors', async () => {
    const dir = tempProject({
      '.gherkin-lintrc': JSON.stringify({ indentation: 'on' }),
      'x.feature': `Feature: F
Scenario: S
Given x
`,
    });
    const code = await runCli([
      'node',
      'cli',
      '-c',
      join(dir, '.gherkin-lintrc'),
      join(dir, 'x.feature'),
    ]);
    expect(code).toBe(1);
  });

  it('returns 1 when lint rejects', async () => {
    const dir = tempProject({
      '.gherkin-lintrc': '{}',
      'x.feature': `Feature: F
Scenario: S
  Given x
`,
    });
    vi.spyOn(linter, 'lint').mockRejectedValueOnce(new Error('boom'));
    const code = await runCli([
      'node',
      'cli',
      '-c',
      join(dir, '.gherkin-lintrc'),
      join(dir, 'x.feature'),
    ]);
    expect(code).toBe(1);
  });
});

describe('isCliEntrypoint', () => {
  it('is false when argv[1] is missing', () => {
    const orig = process.argv.slice();
    process.argv.length = 1;
    try {
      expect(isCliEntrypoint()).toBe(false);
    } finally {
      process.argv.length = 0;
      process.argv.push(...orig);
    }
  });

  it('is false when resolving this script path throws', () => {
    const orig = process.argv.slice();
    process.argv.length = 2;
    process.argv[0] = 'node';
    process.argv[1] = '/fake/main.js';
    try {
      expect(
        isCliEntrypoint(() => {
          throw new Error('x');
        })
      ).toBe(false);
    } finally {
      process.argv.length = 0;
      process.argv.push(...orig);
    }
  });
});

describe('runCliEntrypointIfNeeded', () => {
  it('invokes attachProcessExit when isEntrypoint is true', () => {
    const attachProcessExit = vi.fn();
    runCliEntrypointIfNeeded({
      isEntrypoint: () => true,
      attachProcessExit,
    });
    expect(attachProcessExit).toHaveBeenCalledTimes(1);
  });

  it('does not attach when isEntrypoint is false', () => {
    const attachProcessExit = vi.fn();
    runCliEntrypointIfNeeded({
      isEntrypoint: () => false,
      attachProcessExit,
    });
    expect(attachProcessExit).not.toHaveBeenCalled();
  });
});

describe('attachCliProcessExit', () => {
  it('calls process.exit with the resolved exit code', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    attachCliProcessExit(['node', 'x'], () => Promise.resolve(42));
    await vi.waitFor(() => {
      expect(exitSpy).toHaveBeenCalledWith(42);
    });
    exitSpy.mockRestore();
  });

  it('logs and exits 1 when the run promise rejects', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(logger, 'boldError').mockImplementation(() => {});
    attachCliProcessExit(['node', 'x'], () => Promise.reject(new Error('nope')));
    await vi.waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith('Error: nope');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });
});
