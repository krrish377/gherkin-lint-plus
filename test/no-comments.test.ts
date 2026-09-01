import { describe, expect, it } from 'vitest';
import { noCommentsRule } from '../src/rules/no-comments.js';

const file = (lines: string[]) => ({ relativePath: 'a.feature', lines });

describe('no-comments', () => {
  it('reports every commented line', () => {
    const errors = noCommentsRule.run(undefined, file([
      'Feature: a',
      '  # why this is here',
      '  Scenario: b',
      '    # and this',
    ]), {});

    expect(errors).toHaveLength(2);
    expect(errors![0]).toMatchObject({ rule: 'no-comments', line: 2 });
    expect(errors![1]!.line).toBe(4);
  });

  it('reports nothing when there are no comments', () => {
    expect(noCommentsRule.run(undefined, file(['Feature: a', '  Scenario: b']), {})).toHaveLength(0);
  });

  it('does not mistake a hash inside a step for a comment', () => {
    expect(noCommentsRule.run(undefined, file(['    Given a tag #one']), {})).toHaveLength(0);
  });
});
