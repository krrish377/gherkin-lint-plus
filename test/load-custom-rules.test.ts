import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCustomRulesFromDirectories } from '../src/rules/load-custom-rules.js';

describe('loadCustomRulesFromDirectories', () => {
  it('throws when directory does not exist', () => {
    expect(() => loadCustomRulesFromDirectories([join(tmpdir(), 'no-such-rules-dir-999')])).toThrow(
      /does not exist/
    );
  });

  it('throws when module does not export a rule object', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gherkin-lint-rules-'));
    writeFileSync(join(dir, 'bad.ts'), 'export default 42;\n');
    expect(() => loadCustomRulesFromDirectories([dir])).toThrow(/default-export an object/);
  });
});
