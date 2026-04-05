import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import { describe, expect, it, afterEach } from 'vitest';
import * as configParser from '../src/config-parser.js';
import * as linter from '../src/linter.js';
import { invalidateRulesMapCache } from '../src/rules/registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rulesdirRoot = path.join(__dirname, 'fixtures', 'rulesdir');

describe('rulesdir / custom rules', () => {
  afterEach(() => {
    invalidateRulesMapCache();
  });

  it('loads additional rules from --rulesdir directories (TypeScript)', async () => {
    const additionalRulesDirs = [
      path.join(rulesdirRoot, 'rules'),
      path.join(rulesdirRoot, 'other_rules'),
    ];
    const config = configParser.getConfiguration(path.join(rulesdirRoot, '.gherkin-lintrc'), additionalRulesDirs);
    const featureFile = path.join(rulesdirRoot, 'simple.feature');
    const results = await linter.lint([featureFile], config, additionalRulesDirs);

    expect(results).toHaveLength(1);
    const { filePath, errors } = results[0]!;
    expect(filePath).toBe(realpathSync(featureFile));

    const byRule = Object.fromEntries(errors.map((e) => [e.rule, e]));
    expect(byRule.indentation?.message).toMatch(/Wrong indentation for "Feature"/);
    expect(byRule.indentation?.line).toBe(1);
    expect(byRule.custom).toMatchObject({ line: 123, message: 'Custom error', rule: 'custom' });
    expect(byRule['another-custom-list']).toMatchObject({
      line: 109,
      message: 'Another custom-list error',
      rule: 'another-custom-list',
    });
    expect(byRule['another-custom']).toMatchObject({
      line: 456,
      message: 'Another custom error',
      rule: 'another-custom',
    });
    expect(errors).toHaveLength(4);
  });

  it('throws when rules directory is missing', () => {
    expect(() =>
      configParser.getConfiguration(path.join(rulesdirRoot, '.gherkin-lintrc'), ['/no/such/rulesdir'])
    ).toThrow(/Rules directory does not exist/);
  });
});
