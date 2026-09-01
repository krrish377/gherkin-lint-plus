import { afterEach, describe, expect, it } from 'vitest';
import { noDupeFeatureTagsRule } from '../src/rules/no-dupe-feature-tags.js';
import { resetDuplicateFeatureState } from '../src/rules/duplicate-state.js';
import { parseFeatureSource } from './helpers/parse-feature.js';

const lint = (source: string, path: string, tags: string[]) => {
  const { feature, file } = parseFeatureSource(path, source);
  return noDupeFeatureTagsRule.run(feature, file, { tags }) ?? [];
};

describe('no-dupe-feature-tags', () => {
  afterEach(resetDuplicateFeatureState);

  it('reports a tag already used by another file', () => {
    expect(lint('@id:a\nFeature: one\n\n  Scenario: s\n    Given g\n', 'one.feature', ['@id:.+']))
      .toHaveLength(0);

    const errors = lint('@id:a\nFeature: two\n\n  Scenario: s\n    Given g\n', 'two.feature', ['@id:.+']);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('one.feature');
  });

  it('ignores tags no pattern matches', () => {
    lint('@keep\nFeature: one\n\n  Scenario: s\n    Given g\n', 'one.feature', ['@id:.+']);
    expect(lint('@keep\nFeature: two\n\n  Scenario: s\n    Given g\n', 'two.feature', ['@id:.+']))
      .toHaveLength(0);
  });
});
