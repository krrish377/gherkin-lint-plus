import { mkdtempSync, writeFileSync } from 'node:fs';
import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ParseError } from '@cucumber/messages';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as logger from '../src/logger.js';
import { invalidateRulesMapCache } from '../src/rules/registry.js';
import { lint, processFatalErrors, readAndParseFile } from '../src/linter.js';

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'gherkin-lint-lc-'));
}

describe('readAndParseFile', () => {
  afterEach(() => {
    invalidateRulesMapCache();
    vi.restoreAllMocks();
  });

  it('resolves parsed feature and source lines', async () => {
    const root = tempDir();
    const f = join(root, 'ok.feature');
    writeFileSync(f, 'Feature: K\nScenario: S\n  Given x\n');
    const p = await readAndParseFile(f);
    expect(p.feature?.name).toBe('K');
    expect(p.file.relativePath).toBe(f);
    expect(p.file.lines.join('\n')).toContain('Feature: K');
  });

  it('rejects with up-to-one-background when duplicate feature-level backgrounds', async () => {
    const root = tempDir();
    const f = join(root, 'dup-bg.feature');
    writeFileSync(
      f,
      `Feature: A
  Background:
    Given a
  Background:
    Given b
  Scenario: S
    When x
`
    );
    await expect(readAndParseFile(f)).rejects.toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'up-to-one-background-per-file' })])
    );
  });

  it('rejects with one-feature-per-file when a second Feature block appears', async () => {
    const root = tempDir();
    const f = join(root, 'two-f.feature');
    writeFileSync(
      f,
      `Feature: First

Scenario: S1
  Given a

Feature: Second

Scenario: S2
  Given b
`
    );
    await expect(readAndParseFile(f)).rejects.toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'one-feature-per-file' })])
    );
  });

  it('rejects with unexpected-error when file cannot be read', async () => {
    const errLog = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const missing = join(tmpdir(), `missing-${Date.now()}.feature`);
    await expect(readAndParseFile(missing)).rejects.toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'unexpected-error' })])
    );
    errLog.mockRestore();
  });

  it('rejects with no-tags-on-backgrounds when a tag precedes Background', async () => {
    const root = tempDir();
    const f = join(root, 'tag-bg.feature');
    writeFileSync(
      f,
      `Feature: F
@t
Background:
  Given x
`
    );
    await expect(readAndParseFile(f)).rejects.toEqual([
      expect.objectContaining({ rule: 'no-tags-on-backgrounds' }),
    ]);
  });

  it('rejects with no-multiline-steps for a non-Gherkin continuation after a step', async () => {
    const root = tempDir();
    const f = join(root, 'ml.feature');
    writeFileSync(
      f,
      `Feature: F
Scenario: S
Given x
  continuation
`
    );
    await expect(readAndParseFile(f)).rejects.toEqual([
      expect.objectContaining({ rule: 'no-multiline-steps' }),
    ]);
  });

  it('rejects with unexpected-error for an unmatched parse message', async () => {
    const root = tempDir();
    const f = join(root, 'garbage.feature');
    writeFileSync(f, 'not gherkin at all !!!\n');
    await expect(readAndParseFile(f)).rejects.toEqual([
      expect.objectContaining({ rule: 'unexpected-error', line: 1 }),
    ]);
  });
});

describe('lint', () => {
  afterEach(() => {
    invalidateRulesMapCache();
  });

  it('runs enabled rules on parsed files', async () => {
    const root = tempDir();
    const f = join(root, 't.feature');
    writeFileSync(
      f,
      `    Feature: T

Scenario: S
  Given g
`
    );
    const results = await lint([f], { indentation: 'on' }, []);
    expect(results).toHaveLength(1);
    expect(results[0]!.filePath).toBe(realpathSync(f));
    expect(results[0]!.errors.some((e) => e.rule === 'indentation')).toBe(true);
  });

  it('captures parse errors per file', async () => {
    const root = tempDir();
    const f = join(root, 'bad.feature');
    writeFileSync(
      f,
      `Feature: A

Scenario: S
  Given x

Feature: B

Scenario: T
  Given y
`
    );
    const results = await lint([f], {}, []);
    expect(results[0]!.errors.some((e) => e.rule === 'one-feature-per-file')).toBe(true);
  });

  it('sorts rule errors by line ascending', async () => {
    const root = tempDir();
    const f = join(root, 'sort.feature');
    writeFileSync(
      f,
      `Feature: F
Scenario: S
Given a
Given b
`
    );
    const results = await lint([f], { indentation: 'on', 'use-and': 'on' }, []);
    const lines = results[0]!.errors.map((e) => e.line);
    expect(lines).toEqual([...lines].sort((a, b) => a - b));
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });
});

function syntheticParseError(line: number, message: string): ParseError {
  return {
    source: { uri: 't.feature', location: { line, column: 1 } },
    message,
  } as ParseError;
}

describe('processFatalErrors', () => {
  it('maps a lone Background+tag-context message to no-tags-on-backgrounds', () => {
    const msg =
      "(3:1): expected: #TagLine, #RuleLine, #Comment, #Empty, got 'Background:'";
    expect(processFatalErrors([syntheticParseError(3, msg)])).toEqual([
      expect.objectContaining({ rule: 'no-tags-on-backgrounds', line: 3 }),
    ]);
  });

  it('accepts legacy #ScenarioLine wording in tag-context detection', () => {
    const out = processFatalErrors([
      syntheticParseError(
        3,
        "(3:1): expected: #TagLine, #ScenarioLine, #Comment, #Empty, got 'Background:'"
      ),
      syntheticParseError(
        4,
        "(4:3): expected: #TagLine, #ScenarioLine, #Comment, #Empty, got 'Given x'"
      ),
    ]);
    expect(out).toEqual([expect.objectContaining({ rule: 'no-tags-on-backgrounds' })]);
  });

  it('stops collapsing errors when a later parse error is not tag-line context', () => {
    const out = processFatalErrors([
      syntheticParseError(
        3,
        "(3:1): expected: #TagLine, #RuleLine, #Comment, #Empty, got 'Background:'"
      ),
      syntheticParseError(
        4,
        "(4:3): expected: #TagLine, #RuleLine, #Comment, #Empty, got 'Given x'"
      ),
      syntheticParseError(2, "(2:1): got 'Feature'"),
    ]);
    expect(out[0]!.rule).toBe('no-tags-on-backgrounds');
    expect(out.some((e) => e.rule === 'one-feature-per-file')).toBe(true);
  });
});
