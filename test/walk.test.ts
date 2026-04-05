import { describe, expect, it } from 'vitest';
import {
  forEachScenario,
  forEachTagHost,
  tagHostKeywordTags,
} from '../src/rules/utils/walk.js';
import { parseFeatureSource } from './helpers/parse-feature.js';

function featureFrom(gherkin: string) {
  const { feature } = parseFeatureSource('t.feature', gherkin);
  if (!feature) {
    throw new Error('expected feature');
  }
  return feature;
}

describe('forEachScenario', () => {
  it('visits feature-level scenarios with rule undefined', () => {
    const f = featureFrom(`Feature: F
Scenario: A
  Given x
`);
    const seen: string[] = [];
    forEachScenario(f, (sc, ctx) => {
      seen.push(sc.name);
      expect(ctx.rule).toBeUndefined();
    });
    expect(seen).toEqual(['A']);
  });

  it('visits scenarios under a Rule with ctx.rule set', () => {
    const f = featureFrom(`Feature: F
Rule: R
Scenario: B
  Given y
`);
    const seen: { name: string; rule?: string }[] = [];
    forEachScenario(f, (sc, ctx) => {
      seen.push({ name: sc.name, rule: ctx.rule?.name });
    });
    expect(seen).toEqual([{ name: 'B', rule: 'R' }]);
  });

  it('visits both feature-level and rule-level scenarios in order', () => {
    const f = featureFrom(`Feature: F
Scenario: A
  Given x
Rule: R
Scenario: B
  Given y
`);
    const seen: { name: string; rule?: string }[] = [];
    forEachScenario(f, (sc, ctx) => {
      seen.push({ name: sc.name, rule: ctx.rule?.name });
    });
    expect(seen).toEqual([
      { name: 'A', rule: undefined },
      { name: 'B', rule: 'R' },
    ]);
  });
});

describe('forEachTagHost', () => {
  it('visits the Feature, Scenarios, and Examples on a feature-level outline', () => {
    const f = featureFrom(`Feature: F
Scenario Outline: O
  Given x
Examples:
  | n |
  | 1 |
`);
    const keywords: string[] = [];
    forEachTagHost(f, (node) => keywords.push(node.keyword));
    expect(keywords).toContain('Feature');
    expect(keywords).toContain('Scenario Outline');
    expect(keywords.filter((k) => k === 'Examples').length).toBe(1);
  });

  it('visits Examples on an outline under a Rule', () => {
    const f = featureFrom(`Feature: F
Rule: R
Scenario Outline: O
  Given x
Examples:
  | n |
  | 1 |
`);
    const keywords: string[] = [];
    forEachTagHost(f, (node) => keywords.push(node.keyword));
    expect(keywords).toContain('Rule');
    expect(keywords.filter((k) => k === 'Examples').length).toBe(1);
  });
});

describe('tagHostKeywordTags', () => {
  it('returns keyword and tags from a Feature node', () => {
    const f = featureFrom(`@ftag
Feature: F
Scenario: S
  Given x
`);
    const t = tagHostKeywordTags(f);
    expect(t.keyword).toBe('Feature');
    expect(t.tags.some((tag) => tag.name === '@ftag')).toBe(true);
  });
});
