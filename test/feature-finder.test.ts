import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFeatureFiles } from '../src/feature-finder.js';
import * as logger from '../src/logger.js';

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'gherkin-lint-ff-'));
}

describe('getFeatureFiles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('collects **/*.feature under . when given a directory path', () => {
    const root = tempDir();
    mkdirSync(join(root, 'nested'));
    writeFileSync(join(root, 'a.feature'), 'Feature: A\n');
    writeFileSync(join(root, 'nested', 'b.feature'), 'Feature: B\n');

    const files = getFeatureFiles([root], undefined).sort();
    expect(files.map((f) => f.replace(/\\/g, '/')).sort()).toEqual(
      [join(root, 'a.feature'), join(root, 'nested', 'b.feature')]
        .map((f) => f.replace(/\\/g, '/'))
        .sort()
    );
  });

  it('accepts a direct .feature file path', () => {
    const root = tempDir();
    const fp = join(root, 'one.feature');
    writeFileSync(fp, 'Feature: X\n');
    expect(getFeatureFiles([fp], undefined)).toEqual([fp]);
  });

  it('merges multiple patterns and dedupes', () => {
    const root = tempDir();
    const a = join(root, 'a.feature');
    writeFileSync(a, 'Feature: A\n');
    const files = getFeatureFiles([a, a], undefined);
    expect(files).toEqual([a]);
  });

  it('applies -i ignore globs when provided', () => {
    const root = tempDir();
    mkdirSync(join(root, 'skip-me'), { recursive: true });
    writeFileSync(join(root, 'keep.feature'), 'Feature: K\n');
    writeFileSync(join(root, 'skip-me', 'hidden.feature'), 'Feature: H\n');
    const files = getFeatureFiles([root], ['**/skip-me/**']);
    expect(files.some((f) => f.includes('skip-me'))).toBe(false);
    expect(files.some((f) => f.endsWith('keep.feature'))).toBe(true);
  });

  it('throws after process.exit(1) for invalid path pattern (exit mocked)', () => {
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT_${code}`);
    });
    const boldSpy = vi.spyOn(logger, 'boldError').mockImplementation(() => {});
    expect(() => getFeatureFiles(['/nonexistent/path/gherkin-lint-xyz-999'], undefined)).toThrow('EXIT_1');
    expect(boldSpy).toHaveBeenCalled();
  });

  it('expands patterns that contain /**/', () => {
    const root = tempDir();
    mkdirSync(join(root, 'a', 'b'), { recursive: true });
    writeFileSync(join(root, 'a', 'b', 'deep.feature'), 'Feature: D\n');
    const files = getFeatureFiles([`${root}/**`], undefined);
    expect(files.some((f) => f.endsWith('deep.feature'))).toBe(true);
  });
});
