import type { Feature } from '@cucumber/messages';
import { beforeEach, describe, expect, it } from 'vitest';
import { allowedTagsRule } from '../src/rules/allowed-tags.js';
import { fileNameRule } from '../src/rules/file-name.js';
import { indentationRule } from '../src/rules/indentation.js';
import { keywordsInLogicalOrderRule } from '../src/rules/keywords-in-logical-order.js';
import { maxScenariosPerFileRule } from '../src/rules/max-scenarios-per-file.js';
import { nameLengthRule } from '../src/rules/name-length.js';
import { newLineAtEofRule } from '../src/rules/new-line-at-eof.js';
import { noBackgroundOnlyScenarioRule } from '../src/rules/no-background-only-scenario.js';
import { noDupeFeatureNamesRule } from '../src/rules/no-dupe-feature-names.js';
import { noDupeScenarioNamesRule } from '../src/rules/no-dupe-scenario-names.js';
import { noDuplicateTagsRule } from '../src/rules/no-duplicate-tags.js';
import { noEmptyBackgroundRule } from '../src/rules/no-empty-background.js';
import { noEmptyFileRule } from '../src/rules/no-empty-file.js';
import { noExamplesInScenariosRule } from '../src/rules/no-examples-in-scenarios.js';
import { noFilesWithoutScenariosRule } from '../src/rules/no-files-without-scenarios.js';
import { noHomogenousTagsRule } from '../src/rules/no-homogenous-tags.js';
import { noMultipleEmptyLinesRule } from '../src/rules/no-multiple-empty-lines.js';
import { noPartiallyCommentedTagLinesRule } from '../src/rules/no-partially-commented-tag-lines.js';
import { noRestrictedPatternsRule } from '../src/rules/no-restricted-patterns.js';
import { noRestrictedTagsRule } from '../src/rules/no-restricted-tags.js';
import { noScenarioOutlinesWithoutExamplesRule } from '../src/rules/no-scenario-outlines-without-examples.js';
import { noSuperfluousTagsRule } from '../src/rules/no-superfluous-tags.js';
import { noTrailingSpacesRule } from '../src/rules/no-trailing-spaces.js';
import { noUnnamedFeaturesRule } from '../src/rules/no-unnamed-features.js';
import { noUnnamedScenariosRule } from '../src/rules/no-unnamed-scenarios.js';
import { noUnusedVariablesRule } from '../src/rules/no-unused-variables.js';
import { oneSpaceBetweenTagsRule } from '../src/rules/one-space-between-tags.js';
import { onlyOneWhenRule } from '../src/rules/only-one-when.js';
import { requiredTagsRule } from '../src/rules/required-tags.js';
import { scenarioSizeRule } from '../src/rules/scenario-size.js';
import { useAndRule } from '../src/rules/use-and.js';
import {
  resetDuplicateFeatureState,
  resetDuplicateScenarioState,
} from '../src/rules/duplicate-state.js';
import { parseFeatureSource } from './helpers/parse-feature.js';
import { runRule } from './helpers/run-rule.js';

describe('no-empty-file', () => {
  it('flags whitespace-only source', () => {
    const errors = runRule(noEmptyFileRule, '  \n\t\n  ', {}, 'empty.feature');
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]!.rule).toBe('no-empty-file');
  });

  it('allows a normal feature', () => {
    const g = `Feature: F
Scenario: S
  Given x
`;
    expect(runRule(noEmptyFileRule, g)).toEqual([]);
  });
});

describe('allowed-tags', () => {
  it('flags disallowed tags on feature and rule', () => {
    const g = `@bad
Feature: F
Rule: R
@alsobad
Scenario: S
  Given x
`;
    const errors = runRule(allowedTagsRule, g, { tags: ['@ok'], patterns: [] });
    expect(errors.some((e) => e.message.includes('@bad'))).toBe(true);
    expect(errors.some((e) => e.message.includes('@alsobad'))).toBe(true);
  });
});

describe('file-name', () => {
  const minimalGherkin = `Feature: F
Scenario: S
  Given x
`;

  it('flags wrong style', () => {
    const { feature, file } = parseFeatureSource('my_snake.feature', minimalGherkin);
    const errors = fileNameRule.run(feature, file, { style: 'PascalCase' }) ?? [];
    expect(errors.length).toBe(1);
    expect(errors[0]!.rule).toBe('file-name');
  });

  it('returns no errors when feature is undefined', () => {
    const errors = fileNameRule.run(undefined, { relativePath: 'UserLogin.feature', lines: [] }, {
      style: 'PascalCase',
    });
    expect(errors).toEqual([]);
  });

  it('uses basename only when path has directories', () => {
    const errors = fileNameRule.run(undefined, { relativePath: 'pkg/UserLogin.feature', lines: [] }, {
      style: 'PascalCase',
    });
    expect(errors).toEqual([]);
  });

  it('accepts PascalCase when name matches', () => {
    const { feature, file } = parseFeatureSource('UserLogin.feature', minimalGherkin);
    expect(fileNameRule.run(feature, file, { style: 'PascalCase' })).toEqual([]);
  });

  it('accepts Title Case when name matches', () => {
    const { feature, file } = parseFeatureSource('User Login.feature', minimalGherkin);
    expect(fileNameRule.run(feature, file, { style: 'Title Case' })).toEqual([]);
  });

  it('accepts camelCase when name matches', () => {
    const { feature, file } = parseFeatureSource('userLogin.feature', minimalGherkin);
    expect(fileNameRule.run(feature, file, { style: 'camelCase' })).toEqual([]);
  });

  it('accepts kebab-case when name matches', () => {
    const { feature, file } = parseFeatureSource('user-login.feature', minimalGherkin);
    expect(fileNameRule.run(feature, file, { style: 'kebab-case' })).toEqual([]);
  });

  it('accepts snake_case when name matches', () => {
    const { feature, file } = parseFeatureSource('user_login.feature', minimalGherkin);
    expect(fileNameRule.run(feature, file, { style: 'snake_case' })).toEqual([]);
  });

  it('defaults style to PascalCase when config is empty', () => {
    const { feature, file } = parseFeatureSource('GoodName.feature', minimalGherkin);
    expect(fileNameRule.run(feature, file, {})).toEqual([]);
  });

  it('throws when style is not supported', () => {
    const { feature, file } = parseFeatureSource('x.feature', minimalGherkin);
    expect(() => fileNameRule.run(feature, file, { style: 'UPPER_SNAKE' })).toThrow(
      /not supported/
    );
  });
});

describe('indentation', () => {
  it('returns no errors when feature is undefined', () => {
    expect(indentationRule.run(undefined, { relativePath: 'x.feature', lines: [] }, {})).toEqual([]);
  });

  it('flags mis-indented step', () => {
    const g = `Feature: F
Scenario: S
Given not indented
`;
    const errors = runRule(indentationRule, g);
    expect(errors.some((e) => e.message.includes('Wrong indentation'))).toBe(true);
  });

  it('flags mis-indented feature tag', () => {
    const g = `  @ftag
Feature: F
Scenario: S
  Given x
`;
    const errors = runRule(indentationRule, g);
    expect(errors.some((e) => e.message.includes('feature tag'))).toBe(true);
  });

  it('flags mis-indented scenario tag', () => {
    const g = `Feature: F
  @stag
Scenario: S
  Given x
`;
    const errors = runRule(indentationRule, g);
    expect(errors.some((e) => e.message.includes('scenario tag'))).toBe(true);
  });

  it('uses keyword-specific indent when that keyword is present in config', () => {
    const g = `Feature: F
Scenario: S
  Given x
`;
    const errors = runRule(indentationRule, g, { given: 4 });
    expect(errors.some((e) => e.message.includes('"given"'))).toBe(true);
  });

  it('flags indentation under a Rule', () => {
    const g = `Feature: F
Rule: R
Scenario: S
Given bad
`;
    const errors = runRule(indentationRule, g);
    expect(errors.some((e) => e.rule === 'indentation')).toBe(true);
  });

  it('flags mis-indented tag on a scenario inside a Rule', () => {
    const g = `Feature: F
Rule: R
  @rtag
Scenario: S
  Given x
`;
    const errors = runRule(indentationRule, g);
    expect(errors.some((e) => e.message.includes('scenario tag'))).toBe(true);
  });

  it('checks steps in a feature-level Background', () => {
    const g = `Feature: F
Background:
Given bg
Scenario: S
  Given x
`;
    const errors = runRule(indentationRule, g);
    expect(errors.some((e) => e.message.includes('Wrong indentation'))).toBe(true);
  });

  it('checks steps in a Rule Background', () => {
    const g = `Feature: F
Rule: R
  Background:
  Given bg
  Scenario: S
    Given x
`;
    const errors = runRule(indentationRule, g);
    expect(errors.some((e) => e.message.includes('Wrong indentation'))).toBe(true);
  });

  it('flags mis-indented Examples table rows', () => {
    const g = `Feature: F
Scenario Outline: O
  Given x
Examples:
| n |
  | 1 |
`;
    const errors = runRule(indentationRule, g);
    expect(errors.some((e) => e.message.includes('example'))).toBe(true);
  });

  it('checks scenario outline Examples indentation under a Rule', () => {
    const g = `Feature: F
Rule: R
Scenario Outline: O
  Given x
Examples:
  | n |
  | 1 |
`;
    expect(runRule(indentationRule, g)).toEqual([]);
  });

  it('respects explicit feature tag indent override', () => {
    const g = `@ok
Feature: F
Scenario: S
  Given x
`;
    expect(
      runRule(indentationRule, g, { 'feature tag': 0, Feature: 0, Scenario: 0, Step: 2 })
    ).toEqual([]);
  });

  it('respects explicit scenario tag indent when both tag keys are set', () => {
    const g = `@a @b
Feature: F
@x @y
Scenario: S
  Given z
`;
    expect(
      runRule(indentationRule, g, {
        'feature tag': 0,
        'scenario tag': 0,
        Feature: 0,
        Scenario: 0,
        Step: 2,
      })
    ).toEqual([]);
  });
});

describe('keywords-in-logical-order', () => {
  it('flags Then before When', () => {
    const g = `Feature: F
Scenario: S
  Given a
  Then b
  When c
`;
    const errors = runRule(keywordsInLogicalOrderRule, g);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]!.rule).toBe('keywords-in-logical-order');
  });
});

describe('max-scenarios-per-file', () => {
  it('returns no errors when feature is undefined', () => {
    expect(
      maxScenariosPerFileRule.run(undefined, { relativePath: 'x.feature', lines: [] }, {})
    ).toEqual([]);
  });

  it('allows count equal to default maxScenarios', () => {
    let g = 'Feature: F\n';
    for (let i = 0; i < 10; i++) {
      g += `Scenario: S${i}\n  Given x\n`;
    }
    expect(runRule(maxScenariosPerFileRule, g)).toEqual([]);
  });

  it('flags when exceeding default max', () => {
    let g = 'Feature: F\n';
    for (let i = 0; i < 11; i++) {
      g += `Scenario: S${i}\n  Given x\n`;
    }
    const errors = runRule(maxScenariosPerFileRule, g);
    expect(errors.length).toBe(1);
    expect(errors[0]!.rule).toBe('max-scenarios-per-file');
    expect(errors[0]!.message).toMatch(/11\/10/);
  });

  it('counts each Examples row when countOutlineExamples is true', () => {
    const g = `Feature: F
Scenario Outline: O
  Given x
Examples:
  | n |
  | 1 |
  | 2 |
`;
    const errors = runRule(maxScenariosPerFileRule, g, { maxScenarios: 1 });
    expect(errors.length).toBe(1);
    expect(errors[0]!.message).toMatch(/2\/1/);
  });

  it('counts a scenario outline as one when countOutlineExamples is false', () => {
    const g = `Feature: F
Scenario Outline: O
  Given x
Examples:
  | n |
  | 1 |
  | 2 |
`;
    expect(
      runRule(maxScenariosPerFileRule, g, { maxScenarios: 1, countOutlineExamples: false })
    ).toEqual([]);
  });

  it('sums example rows across multiple Examples tables', () => {
    const g = `Feature: F
Scenario Outline: O
  Given <a>
Examples: First
  | a |
  | 1 |
Examples: Second
  | a |
  | 2 |
`;
    const errors = runRule(maxScenariosPerFileRule, g, { maxScenarios: 1 });
    expect(errors.length).toBe(1);
    expect(errors[0]!.message).toMatch(/2\/1/);
  });

  it('counts scenarios declared under a Rule', () => {
    const g = `Feature: F
Rule: R
Scenario: A
  Given x
Scenario: B
  Given y
`;
    const errors = runRule(maxScenariosPerFileRule, g, { maxScenarios: 1 });
    expect(errors.length).toBe(1);
    expect(errors[0]!.message).toMatch(/2\/1/);
  });
});

describe('name-length', () => {
  it('returns no errors when feature is undefined', () => {
    expect(nameLengthRule.run(undefined, { relativePath: 'x.feature', lines: [] }, {})).toEqual([]);
  });

  it('flags long feature name', () => {
    const long = 'a'.repeat(10);
    const g = `Feature: ${long}
Scenario: S
  Given x
`;
    const errors = runRule(nameLengthRule, g, { Feature: 5 });
    expect(errors.some((e) => e.rule === 'name-length' && e.message.includes('Feature'))).toBe(
      true
    );
  });

  it('flags long rule name', () => {
    const g = `Feature: F
Rule: RRRRRR
Scenario: S
  Given x
`;
    const errors = runRule(nameLengthRule, g, { Rule: 3 });
    expect(errors.some((e) => e.message.includes('Rule'))).toBe(true);
  });

  it('flags long scenario name at feature level', () => {
    const g = `Feature: F
Scenario: SSSSSS
  Given x
`;
    const errors = runRule(nameLengthRule, g, { Scenario: 3 });
    expect(errors.some((e) => e.message.includes('Scenario'))).toBe(true);
  });

  it('flags long step text in a feature-level scenario', () => {
    const g = `Feature: F
Scenario: S
  Given this step text is lengthy
`;
    const errors = runRule(nameLengthRule, g, { Step: 8 });
    expect(errors.some((e) => e.message.includes('Step'))).toBe(true);
  });

  it('flags long step text in a feature-level background', () => {
    const g = `Feature: F
Background:
  Given background step is quite long
Scenario: S
  Given x
`;
    const errors = runRule(nameLengthRule, g, { Step: 10 });
    expect(errors.some((e) => e.message.includes('Step'))).toBe(true);
  });

  it('flags long scenario and steps under a Rule', () => {
    const g = `Feature: F
Rule: R
Scenario: LONGSCENARIONAME
  Given step text exceeds limit here
`;
    const errors = runRule(nameLengthRule, g, { Scenario: 5, Step: 12 });
    expect(errors.some((e) => e.message.includes('Scenario'))).toBe(true);
    expect(errors.some((e) => e.message.includes('Step'))).toBe(true);
  });

  it('flags long steps in a Rule background', () => {
    const g = `Feature: F
Rule: R
  Background:
    Given rule background step is too long for limit
  Scenario: S
    Given x
`;
    const errors = runRule(nameLengthRule, g, { Step: 15 });
    expect(errors.some((e) => e.message.includes('Step'))).toBe(true);
  });
});

describe('new-line-at-eof', () => {
  it('requires newline when config yes', () => {
    const g = `Feature: F
Scenario: S
  Given x`;
    const errors = runRule(newLineAtEofRule, g, 'yes');
    expect(errors.length).toBe(1);
    expect(errors[0]!.message).toContain('required');
  });
});

describe('no-background-only-scenario', () => {
  it('returns no errors when feature is undefined', () => {
    expect(
      noBackgroundOnlyScenarioRule.run(undefined, { relativePath: 'x.feature', lines: [] }, {})
    ).toEqual([]);
  });

  it('flags background with single scenario at feature level', () => {
    const g = `Feature: F
Background:
  Given bg
Scenario: Only
  Given s
`;
    const errors = runRule(noBackgroundOnlyScenarioRule, g);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]!.rule).toBe('no-background-only-scenario');
  });

  it('allows background when the feature has more than one scenario', () => {
    const g = `Feature: F
Background:
  Given bg
Scenario: A
  Given a
Scenario: B
  Given b
`;
    expect(runRule(noBackgroundOnlyScenarioRule, g)).toEqual([]);
  });

  it('flags background under a Rule with only one scenario', () => {
    const g = `Feature: F
Rule: R
  Background:
    Given bg
  Scenario: Only
    Given s
`;
    const errors = runRule(noBackgroundOnlyScenarioRule, g);
    expect(errors.length).toBe(1);
    expect(errors[0]!.rule).toBe('no-background-only-scenario');
    expect(errors[0]!.message).toContain('Backgrounds are not allowed');
  });

  it('allows background under a Rule when there are multiple scenarios', () => {
    const g = `Feature: F
Rule: R
  Background:
    Given bg
  Scenario: A
    Given a
  Scenario: B
    Given b
`;
    expect(runRule(noBackgroundOnlyScenarioRule, g)).toEqual([]);
  });
});

describe('no-duplicate-tags', () => {
  it('flags duplicate tag on scenario', () => {
    const g = `Feature: F
@dup @dup
Scenario: S
  Given x
`;
    const errors = runRule(noDuplicateTagsRule, g);
    expect(errors.some((e) => e.message.includes('Duplicate tags'))).toBe(true);
  });
});

describe('no-empty-background', () => {
  it('flags empty background under feature', () => {
    const g = `Feature: F
Background:
Scenario: S
  Given x
`;
    const errors = runRule(noEmptyBackgroundRule, g);
    expect(errors.some((e) => e.rule === 'no-empty-background')).toBe(true);
  });

  it('flags empty background under rule', () => {
    const g = `Feature: F
Rule: R
Background:
Scenario: S
  Given x
`;
    const errors = runRule(noEmptyBackgroundRule, g);
    expect(errors.some((e) => e.rule === 'no-empty-background')).toBe(true);
  });
});

describe('no-examples-in-scenarios', () => {
  it('flags Examples on non-outline scenario when parser yields scenario + examples', () => {
    const g = `Feature: F
Scenario: S
  Given <x>
Examples:
  | x |
  | 1 |
`;
    const errors = runRule(noExamplesInScenariosRule, g);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('no-files-without-scenarios', () => {
  it('flags feature with only background', () => {
    const g = `Feature: F
Background:
  Given x
`;
    const errors = runRule(noFilesWithoutScenariosRule, g);
    expect(errors.length).toBe(1);
  });
});

describe('no-homogenous-tags', () => {
  it('returns no errors when feature is undefined', () => {
    expect(
      noHomogenousTagsRule.run(undefined, { relativePath: 'x.feature', lines: [] }, {})
    ).toEqual([]);
  });

  it('flags same tags on every scenario', () => {
    const g = `Feature: F

@t
Scenario: A
  Given x

@t
Scenario: B
  Given y
`;
    const errors = runRule(noHomogenousTagsRule, g);
    expect(errors.some((e) => e.message.includes('Feature'))).toBe(true);
  });

  it('flags when every scenario under a Rule shares the same tag', () => {
    const g = `Feature: F
Rule: R
@t
Scenario: A
  Given x
@t
Scenario: B
  Given y
`;
    const errors = runRule(noHomogenousTagsRule, g);
    expect(errors.some((e) => e.message.includes('Feature'))).toBe(true);
  });

  it('flags when all Examples tables on an outline share the same tag', () => {
    const g = `Feature: F
Scenario Outline: O
  Given <x>
@dup
Examples: First
  | x |
  | 1 |
@dup
Examples: Second
  | x |
  | 2 |
`;
    const errors = runRule(noHomogenousTagsRule, g);
    expect(errors.some((e) => e.message.includes('Examples of a Scenario Outline'))).toBe(true);
  });

  it('does not flag when scenarios use different tags', () => {
    const g = `Feature: F
@a
Scenario: A
  Given x
@b
Scenario: B
  Given y
`;
    expect(
      runRule(noHomogenousTagsRule, g).some((e) => e.message.includes('All Scenarios on this Feature'))
    ).toBe(false);
  });

  it('does not flag a single untagged scenario', () => {
    const g = `Feature: F
Scenario: A
  Given x
`;
    expect(runRule(noHomogenousTagsRule, g)).toEqual([]);
  });

  it('outline with a single Examples block that has tags is reported (tags belong on outline)', () => {
    const g = `Feature: F
Scenario Outline: O
  Given <x>
@onExamples
Examples:
  | x |
  | 1 |
`;
    const errors = runRule(noHomogenousTagsRule, g);
    expect(errors.some((e) => e.message.includes('Examples of a Scenario Outline'))).toBe(true);
  });
});

describe('no-multiple-empty-lines', () => {
  it('flags two consecutive blank lines in file', () => {
    const g = `Feature: F


Scenario: S
  Given x
`;
    const errors = runRule(noMultipleEmptyLinesRule, g);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('no-partially-commented-tag-lines', () => {
  it('flags tag containing # after first char', () => {
    const g = `Feature: F
@foo#bar
Scenario: S
  Given x
`;
    const errors = runRule(noPartiallyCommentedTagLinesRule, g);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('no-restricted-patterns', () => {
  it('matches feature name against configured pattern', () => {
    const g = `Feature: BADWORD
Scenario: S
  Given x
`;
    const errors = runRule(noRestrictedPatternsRule, g, { Feature: ['BADWORD'] });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('checks rule name when Rule block present', () => {
    const g = `Feature: F
Rule: SECRET
Scenario: S
  Given x
`;
    const errors = runRule(noRestrictedPatternsRule, g, { Rule: ['SECRET'] });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('no-restricted-tags', () => {
  it('flags forbidden tag', () => {
    const g = `Feature: F
@wip
Scenario: S
  Given x
`;
    const errors = runRule(noRestrictedTagsRule, g, { tags: ['@wip'], patterns: [] });
    expect(errors.some((e) => e.message.includes('Forbidden'))).toBe(true);
  });
});

describe('no-scenario-outlines-without-examples', () => {
  it('flags outline without example rows', () => {
    const g = `Feature: F
Scenario Outline: O
  Given <a>
Examples:
  | a |
`;
    const errors = runRule(noScenarioOutlinesWithoutExamplesRule, g);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('no-superfluous-tags', () => {
  it('returns no errors when feature is undefined', () => {
    expect(
      noSuperfluousTagsRule.run(undefined, { relativePath: 'x.feature', lines: [] }, {})
    ).toEqual([]);
  });

  it('flags tag repeated on scenario and feature', () => {
    const g = `@same
Feature: F

@same
Scenario: S
  Given x
`;
    const errors = runRule(noSuperfluousTagsRule, g);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('flags tag repeated on scenario outline Examples and feature', () => {
    const g = `@dup
Feature: F
Scenario Outline: O
  Given <x>
@dup
Examples:
  | x |
  | 1 |
`;
    const errors = runRule(noSuperfluousTagsRule, g);
    expect(errors.some((e) => e.rule === 'no-superfluous-tags')).toBe(true);
  });

  it('flags tag repeated on Rule and feature', () => {
    const g = `@shared
Feature: F
Rule: R
@shared
Scenario: S
  Given x
`;
    const errors = runRule(noSuperfluousTagsRule, g);
    expect(errors.some((e) => e.rule === 'no-superfluous-tags')).toBe(true);
  });

  it('flags superfluous tags under Rule for scenario vs feature and vs rule', () => {
    const g = `@f @r
Feature: F
Rule: R
@f @r
Scenario: S
  Given x
`;
    const errors = runRule(noSuperfluousTagsRule, g);
    expect(errors.filter((e) => e.rule === 'no-superfluous-tags').length).toBeGreaterThanOrEqual(2);
  });

  it('flags Examples tags duplicated vs feature, scenario, and rule', () => {
    const g = `@e
Feature: F
Rule: R
Scenario Outline: O
  Given <x>
@e
Examples:
  | x |
  | 1 |
`;
    const errors = runRule(noSuperfluousTagsRule, g);
    expect(errors.filter((e) => e.rule === 'no-superfluous-tags').length).toBeGreaterThanOrEqual(1);
  });
});

describe('no-trailing-spaces', () => {
  it('flags trailing spaces on a line', () => {
    const g = `Feature: F  
Scenario: S
  Given x
`;
    const errors = runRule(noTrailingSpacesRule, g);
    expect(errors.some((e) => e.rule === 'no-trailing-spaces')).toBe(true);
  });
});

describe('no-unnamed-features', () => {
  it('flags missing feature name', () => {
    const g = `Feature:
Scenario: S
  Given x
`;
    const errors = runRule(noUnnamedFeaturesRule, g);
    expect(errors.some((e) => e.rule === 'no-unnamed-features')).toBe(true);
  });
});

describe('no-unnamed-scenarios', () => {
  it('flags missing scenario name', () => {
    const g = `Feature: F
Scenario:
  Given x
`;
    const errors = runRule(noUnnamedScenariosRule, g);
    expect(errors.some((e) => e.rule === 'no-unnamed-scenarios')).toBe(true);
  });
});

describe('no-unused-variables', () => {
  it('returns no errors when feature is undefined', () => {
    expect(
      noUnusedVariablesRule.run(undefined, { relativePath: 'x.feature', lines: [] }, {})
    ).toEqual([]);
  });

  it('skips scenario outlines that have no Examples tables', () => {
    const g = `Feature: F
Scenario Outline: O
  Given x
`;
    expect(runRule(noUnusedVariablesRule, g)).toEqual([]);
  });

  it('flags unused examples column', () => {
    const g = `Feature: F
Scenario Outline: O
  Given x
Examples:
  | a |
  | 1 |
`;
    const errors = runRule(noUnusedVariablesRule, g);
    expect(errors.some((e) => e.message.includes('not used'))).toBe(true);
  });

  it('flags step variable missing from examples table', () => {
    const g = `Feature: F
Scenario Outline: O
  Given I use <ghost>
Examples:
  | real |
  | 1 |
`;
    const errors = runRule(noUnusedVariablesRule, g);
    expect(
      errors.some((e) => e.message.includes('does not exist in the examples table'))
    ).toBe(true);
    expect(errors.some((e) => e.message.includes('ghost'))).toBe(true);
  });

  it('allows matching variable in step text', () => {
    const g = `Feature: F
Scenario Outline: O
  Given I have <count> items
Examples:
  | count |
  | 3 |
`;
    expect(runRule(noUnusedVariablesRule, g)).toEqual([]);
  });

  it('detects variables in scenario outline title', () => {
    const g = `Feature: F
Scenario Outline: Order <item>
  Given I pick <item>
Examples:
  | item |
  | apple |
`;
    expect(runRule(noUnusedVariablesRule, g)).toEqual([]);
  });

  it('detects variables in data table cells', () => {
    const g = `Feature: F
Scenario Outline: O
  Given rows:
    | col |
    | <a> |
Examples:
  | a |
  | x |
`;
    expect(runRule(noUnusedVariablesRule, g)).toEqual([]);
  });

  it('detects variables in doc strings', () => {
    const g = `Feature: F
Scenario Outline: O
  Given payload
    """
    id=<id>
    """
Examples:
  | id |
  | 7 |
`;
    expect(runRule(noUnusedVariablesRule, g)).toEqual([]);
  });
});

describe('one-space-between-tags', () => {
  it('flags large gap between tags', () => {
    const g = `Feature: F
@a    @b
Scenario: S
  Given x
`;
    const errors = runRule(oneSpaceBetweenTagsRule, g);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('only-one-when', () => {
  it('flags multiple When in one scenario', () => {
    const g = `Feature: F
Scenario: S
  When a
  When b
`;
    const errors = runRule(onlyOneWhenRule, g);
    expect(errors.some((e) => e.rule === 'only-one-when')).toBe(true);
  });
});

describe('required-tags', () => {
  it('flags scenario without required tag', () => {
    const g = `Feature: F
Scenario: S
  Given x
`;
    const errors = runRule(requiredTagsRule, g, { tags: ['@req'], ignoreUntagged: false });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('scenario-size', () => {
  it('returns no errors when feature is undefined', () => {
    expect(
      scenarioSizeRule.run(undefined, { relativePath: 'x.feature', lines: [] }, {})
    ).toEqual([]);
  });

  it('flags too many steps', () => {
    const g = `Feature: F
Scenario: S
  Given a
  When b
  Then c
`;
    const errors = runRule(scenarioSizeRule, g, {
      'steps-length': { Rule: 15, Background: 15, Scenario: 2 },
    });
    expect(errors.some((e) => e.rule === 'scenario-size')).toBe(true);
  });

  it('flags too many steps in a feature-level Background', () => {
    const g = `Feature: F
Background:
  Given a
  When b
  Then c
Scenario: S
  Given x
`;
    const errors = runRule(scenarioSizeRule, g, {
      'steps-length': { Rule: 15, Background: 2, Scenario: 15 },
    });
    expect(errors.some((e) => e.message.includes('Background'))).toBe(true);
  });

  it('flags too many steps for scenarios under a Rule', () => {
    const g = `Feature: F
Rule: R
Scenario: S
  Given a
  When b
  Then c
`;
    const errors = runRule(scenarioSizeRule, g, {
      'steps-length': { Rule: 2, Background: 15, Scenario: 15 },
    });
    expect(errors.some((e) => e.message.includes('Scenario'))).toBe(true);
  });

  it('flags too many steps in a Rule Background', () => {
    const g = `Feature: F
Rule: R
  Background:
    Given a
    When b
    Then c
  Scenario: S
    Given x
`;
    const errors = runRule(scenarioSizeRule, g, {
      'steps-length': { Rule: 2, Background: 15, Scenario: 15 },
    });
    expect(errors.some((e) => e.message.includes('Background'))).toBe(true);
  });

  it('allows scenarios within limit when config is empty (defaults)', () => {
    const g = `Feature: F
Scenario: S
  Given a
  When b
`;
    expect(runRule(scenarioSizeRule, g, {})).toEqual([]);
  });

  it('does not check when step limits are zero', () => {
    let g = 'Feature: F\nScenario: S\n';
    for (let i = 0; i < 20; i++) {
      g += `  Given s${i}\n`;
    }
    expect(
      runRule(scenarioSizeRule, g, {
        'steps-length': { Rule: 0, Background: 0, Scenario: 0 },
      })
    ).toEqual([]);
  });

  it('skips a feature child with no rule, background, or scenario (defensive)', () => {
    const feature = {
      language: 'en',
      name: 'F',
      location: { line: 1, column: 1 },
      children: [
        {
          rule: undefined,
          background: undefined,
          scenario: undefined,
        },
      ],
    } as unknown as Feature;
    expect(scenarioSizeRule.run(feature, { relativePath: 'x.feature', lines: [] }, {})).toEqual([]);
  });
});

describe('use-and', () => {
  it('returns no errors when feature is undefined', () => {
    expect(useAndRule.run(undefined, { relativePath: 'x.feature', lines: [] }, {})).toEqual([]);
  });

  it('flags consecutive Given without And', () => {
    const g = `Feature: F
Scenario: S
  Given a
  Given b
`;
    const errors = runRule(useAndRule, g);
    expect(errors.some((e) => e.rule === 'use-and')).toBe(true);
  });

  it('does not flag when And separates repeated keywords', () => {
    const g = `Feature: F
Scenario: S
  Given a
  And b
  When c
  And d
`;
    expect(runRule(useAndRule, g)).toEqual([]);
  });

  it('flags consecutive steps under a Rule', () => {
    const g = `Feature: F
Rule: R
Scenario: S
  Given a
  Given b
`;
    const errors = runRule(useAndRule, g);
    expect(errors.some((e) => e.rule === 'use-and')).toBe(true);
  });
});

describe('no-dupe-feature-names', () => {
  beforeEach(() => {
    resetDuplicateFeatureState();
  });

  it('second file with same feature name reports duplicate', () => {
    const g = `Feature: Same
Scenario: A
  Given x
`;
    expect(runRule(noDupeFeatureNamesRule, g, {}, 'a.feature')).toEqual([]);
    const errors = runRule(noDupeFeatureNamesRule, g, {}, 'b.feature');
    expect(errors.length).toBe(1);
    expect(errors[0]!.rule).toBe('no-dupe-feature-names');
  });
});

describe('no-dupe-scenario-names', () => {
  beforeEach(() => {
    resetDuplicateScenarioState();
  });

  it('flags duplicate scenario names in the same feature', () => {
    const g = `Feature: F
Scenario: Dup
  Given a
Scenario: Dup
  Given b
`;
    const errors = runRule(noDupeScenarioNamesRule, g, 'in-feature');
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('new-line-at-eof throws on invalid config', () => {
  it('throws when subconfig missing', () => {
    expect(() => runRule(newLineAtEofRule, 'Feature: F\n', {})).toThrow(/requires an extra/);
  });
});
