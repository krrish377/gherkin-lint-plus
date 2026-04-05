import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getConfiguration } from '../src/config-parser.js';
import * as logger from '../src/logger.js';

describe('getConfiguration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads JSON from an explicit config path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gherkin-lint-cp-'));
    const p = join(dir, '.gherkin-lintrc');
    writeFileSync(p, JSON.stringify({ 'no-trailing-spaces': 'on' }));
    const c = getConfiguration(p, []);
    expect(c['no-trailing-spaces']).toBe('on');
  });

  it('supports // comments in config (JSONC)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gherkin-lint-cp-'));
    const p = join(dir, 'cfg');
    writeFileSync(p, '{ "no-trailing-spaces": "on" // c\n}\n');
    const c = getConfiguration(p, []);
    expect(c['no-trailing-spaces']).toBe('on');
  });

  it('exits when explicit config path is missing', () => {
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT_${code}`);
    });
    vi.spyOn(logger, 'boldError').mockImplementation(() => {});
    expect(() => getConfiguration(join(tmpdir(), `nope-${Date.now()}.json`), [])).toThrow('EXIT_1');
  });

  it('exits when configuration has errors', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gherkin-lint-cp-'));
    const p = join(dir, '.gherkin-lintrc');
    writeFileSync(p, JSON.stringify({ 'not-a-real-rule': 'on' }));
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT_${code}`);
    });
    vi.spyOn(logger, 'boldError').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});
    expect(() => getConfiguration(p, [])).toThrow('EXIT_1');
  });
});
