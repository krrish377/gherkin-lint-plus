import { afterEach, describe, expect, it, vi } from 'vitest';
import { printResults } from '../src/formatters/stylish.js';

describe('stylish printResults', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints nothing when there are no errors', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    printResults([{ filePath: '/a.feature', errors: [] }]);
    expect(err).not.toHaveBeenCalled();
  });

  it('prints file path and each error line', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    printResults([
      {
        filePath: '/proj/x.feature',
        errors: [
          { line: 2, message: 'Bad thing', rule: 'r1' },
          { line: 10, message: 'Also bad', rule: 'r2' },
        ],
      },
    ]);
    const text = err.mock.calls.map((c) => String(c[0])).join('\n');
    expect(text).toContain('x.feature');
    expect(text).toContain('Bad thing');
    expect(text).toContain('r1');
    expect(text).toContain('Also bad');
  });

  it('uses stdout columns when isTTY', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const descTty = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    const descCols = Object.getOwnPropertyDescriptor(process.stdout, 'columns');
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'columns', { value: 200, configurable: true });
    printResults([{ filePath: '/f.feature', errors: [{ line: 1, message: 'm', rule: 'r' }] }]);
    if (descTty) {
      Object.defineProperty(process.stdout, 'isTTY', descTty);
    } else {
      delete (process.stdout as { isTTY?: boolean }).isTTY;
    }
    if (descCols) {
      Object.defineProperty(process.stdout, 'columns', descCols);
    } else {
      delete (process.stdout as { columns?: number }).columns;
    }
    expect(err.mock.calls.length).toBeGreaterThan(0);
  });
});
