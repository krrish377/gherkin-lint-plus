import { describe, expect, it, afterEach } from 'vitest';
import { verifyConfigurationFile } from '../src/config-verifier.js';
import { runAllEnabledRules } from '../src/rules/runner.js';
import { getBuiltInRules, getMandatoryRuleNames, invalidateRulesMapCache } from '../src/rules/registry.js';
import { parseFeatureSource } from './helpers/parse-feature.js';

describe('mandatory rules', () => {
  afterEach(() => {
    invalidateRulesMapCache();
  });

  it('rejects "off" in config for mandatory rules', () => {
    const errors = verifyConfigurationFile({ 'no-empty-file': 'off' }, []);
    expect(errors.some((e) => e.includes('mandatory') && e.includes('no-empty-file'))).toBe(true);
  });

  it('rejects ["off", …] for mandatory rules', () => {
    const errors = verifyConfigurationFile({ 'no-unnamed-features': ['off', {}] }, []);
    expect(errors.some((e) => e.includes('mandatory'))).toBe(true);
  });

  it('runs mandatory rules when omitted from config', () => {
    const { feature, file } = parseFeatureSource('x.feature', '   \n\t  ');
    const errors = runAllEnabledRules(feature, file, {}, []);
    expect(errors.some((e) => e.rule === 'no-empty-file')).toBe(true);
  });

  it('every mandatory name maps to a built-in rule', () => {
    const names = new Set(getBuiltInRules().map((r) => r.name));
    for (const m of getMandatoryRuleNames()) {
      expect(names.has(m)).toBe(true);
    }
  });
});
