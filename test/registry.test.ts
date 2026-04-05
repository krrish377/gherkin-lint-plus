import { describe, expect, it } from 'vitest';
import { getBuiltInRules, getMandatoryRuleNames } from '../src/rules/registry.js';

describe('rule registry', () => {
  it('has a unique name for every built-in rule', () => {
    const rules = getBuiltInRules();
    const names = rules.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
    expect(rules.length).toBe(31);
  });

  it('every rule exposes run and availableConfigs shape', () => {
    for (const r of getBuiltInRules()) {
      expect(typeof r.run).toBe('function');
      expect(r.availableConfigs).toBeDefined();
    }
  });

  it('has four mandatory rule names', () => {
    expect(new Set(getMandatoryRuleNames())).toEqual(
      new Set([
        'no-empty-file',
        'no-files-without-scenarios',
        'no-unnamed-features',
        'no-unnamed-scenarios',
      ])
    );
  });
});
