import { describe, expect, it } from 'vitest';
import { requiredFeatureTagsRule } from '../src/rules/required-feature-tags.js';
import { parseFeatureSource } from './helpers/parse-feature.js';

const lint = (source: string, tags: string[]) => {
  const { feature, file } = parseFeatureSource('a.feature', source);
  return requiredFeatureTagsRule.run(feature, file, { tags }) ?? [];
};

describe('required-feature-tags', () => {
  it('accepts a tag on the Feature, where required-tags would not', () => {
    const errors = lint('@id:a\nFeature: a\n\n  Scenario: b\n    Given c\n', ['@id:.+']);
    expect(errors).toHaveLength(0);
  });

  it('reports a Feature missing a required tag', () => {
    const errors = lint('@other\nFeature: a\n\n  Scenario: b\n    Given c\n', ['@id:.+']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ rule: 'required-feature-tags', line: 2 });
    expect(errors[0]!.message).toContain('@id:.+');
  });

  it('reports each missing tag separately', () => {
    const errors = lint('Feature: a\n\n  Scenario: b\n    Given c\n', ['@id:.+', '@source:.+']);
    expect(errors).toHaveLength(2);
  });
});
