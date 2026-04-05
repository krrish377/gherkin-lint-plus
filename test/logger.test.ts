import { describe, expect, it, vi } from 'vitest';
import * as logger from '../src/logger.js';

describe('logger', () => {
  it('boldError and error write to stderr with ANSI', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.boldError('bold');
    logger.error('plain');
    expect(err).toHaveBeenCalledTimes(2);
    expect(String(err.mock.calls[0]?.[0])).toContain('bold');
    expect(String(err.mock.calls[0]?.[0])).toContain('\x1b[31m');
    expect(String(err.mock.calls[1]?.[0])).toContain('plain');
    err.mockRestore();
  });
});
