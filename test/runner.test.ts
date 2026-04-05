import { afterEach, describe, expect, it } from 'vitest';
import { getRuleRunConfig, runAllEnabledRules } from '../src/rules/runner.js';
import { invalidateRulesMapCache } from '../src/rules/registry.js';
import { parseFeatureSource } from './helpers/parse-feature.js';

describe('getRuleRunConfig', () => {
  it('returns {} for undefined, on, off', () => {
    expect(getRuleRunConfig(undefined)).toEqual({});
    expect(getRuleRunConfig('on')).toEqual({});
    expect(getRuleRunConfig('off')).toEqual({});
  });

  it('returns {} for one-element tuple', () => {
    expect(getRuleRunConfig(['on'])).toEqual({});
  });

  it('returns string option from tuple', () => {
    expect(getRuleRunConfig(['on', 'in-feature'])).toBe('in-feature');
  });

  it('returns object option from tuple', () => {
    expect(getRuleRunConfig(['on', { maxScenarios: 3 }])).toEqual({ maxScenarios: 3 });
  });

  it('returns {} when second tuple entry is not a string or object', () => {
    expect(getRuleRunConfig(['on', null as unknown as Record<string, unknown>])).toEqual({});
    expect(getRuleRunConfig(['on', 42 as unknown as Record<string, unknown>])).toEqual({});
  });
});

describe('runAllEnabledRules', () => {
  afterEach(() => {
    invalidateRulesMapCache();
  });

  it('skips rules that are not enabled in configuration', () => {
    const { feature, file } = parseFeatureSource(
      'f.feature',
      `Feature: F
Scenario: S
  Given x`
    );
    const errors = runAllEnabledRules(feature, file, {}, []);
    expect(errors.some((e) => e.rule === 'indentation')).toBe(false);
  });

  it('runs a rule when configured as on', () => {
    const { feature, file } = parseFeatureSource(
      'f.feature',
      `Feature: F
Scenario: S
Given not indented`
    );
    const errors = runAllEnabledRules(feature, file, { indentation: 'on' }, []);
    expect(errors.some((e) => e.rule === 'indentation')).toBe(true);
  });

  it('does not run a rule configured as off', () => {
    const { feature, file } = parseFeatureSource(
      'f.feature',
      `Feature: F
Scenario: S
Given not indented`
    );
    const errors = runAllEnabledRules(feature, file, { indentation: 'off' }, []);
    expect(errors.every((e) => e.rule !== 'indentation')).toBe(true);
  });

  it('does not run a rule configured as ["off", …]', () => {
    const { feature, file } = parseFeatureSource(
      'f.feature',
      `Feature: F
Scenario: S
Given not indented`
    );
    const errors = runAllEnabledRules(feature, file, { indentation: ['off', {}] }, []);
    expect(errors.every((e) => e.rule !== 'indentation')).toBe(true);
  });

  it('always runs mandatory rules even when set to off', () => {
    const { feature, file } = parseFeatureSource('f.feature', '   \n\t  ');
    const errors = runAllEnabledRules(feature, file, { 'no-empty-file': 'off' }, []);
    expect(errors.some((e) => e.rule === 'no-empty-file')).toBe(true);
  });

  it('uses empty effective config for mandatory rule set to off as a tuple', () => {
    const { feature, file } = parseFeatureSource('f.feature', '   \n\t  ');
    const errors = runAllEnabledRules(feature, file, { 'no-empty-file': ['off', { x: 1 }] }, []);
    expect(errors.some((e) => e.rule === 'no-empty-file')).toBe(true);
  });

  it('passes tuple object config into mandatory rules', () => {
    const { feature, file } = parseFeatureSource(
      'f.feature',
      `Feature: F
Scenario: S
  Given x`
    );
    const errors = runAllEnabledRules(
      feature,
      file,
      { 'no-unnamed-features': ['on', { only: true }] },
      []
    );
    expect(errors).toEqual([]);
  });

  it('uses empty effective config for mandatory rule set to plain on', () => {
    const { feature, file } = parseFeatureSource(
      'f.feature',
      `Feature: F
Scenario: S
  Given x`
    );
    const errors = runAllEnabledRules(feature, file, { 'no-unnamed-features': 'on' }, []);
    expect(errors).toEqual([]);
  });

  it('ignores undefined output from a rule', () => {
    const { feature, file } = parseFeatureSource(
      'f.feature',
      `Feature: F
Scenario: S
  Given x`
    );
    const errors = runAllEnabledRules(feature, file, {}, []);
    expect(errors.filter((e) => e.rule === 'no-empty-file')).toEqual([]);
  });

  it('merges errors from multiple enabled rules', () => {
    const { feature, file } = parseFeatureSource(
      'f.feature',
      `Feature: F
Scenario: S
Given a
Given b`
    );
    const errors = runAllEnabledRules(feature, file, { indentation: 'on', 'use-and': 'on' }, []);
    expect(errors.some((e) => e.rule === 'indentation')).toBe(true);
    expect(errors.some((e) => e.rule === 'use-and')).toBe(true);
  });
});
