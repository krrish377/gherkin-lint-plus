import type { FeatureChild, Scenario } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import * as gherkinUtils from './utils/gherkin.js';

const name = 'only-one-when';

function getScenarios(featureChildren: readonly FeatureChild[]): Scenario[] {
  const simpleScenarios = featureChildren
    .filter((child) => child.scenario)
    .map((child) => child.scenario!);

  const ruleScenarios = featureChildren
    .filter((child) => child.rule)
    .flatMap((child) => child.rule!.children)
    .filter((grandchild) => grandchild.scenario)
    .map((grandchild) => grandchild.scenario!);

  return simpleScenarios.concat(ruleScenarios);
}

export const onlyOneWhenRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }

    const errors: LintError[] = [];
    const scenarios = getScenarios(feature.children);

    for (const scenario of scenarios) {
      let lastRealKeyword = '';
      let whenCount = 0;
      let firstViolationLine = 0;

      for (const step of scenario.steps) {
        const keyword = gherkinUtils.getLanguageInsensitiveKeyword(step, feature.language);
        if (keyword === 'when' || (keyword === 'and' && lastRealKeyword === 'when')) {
          lastRealKeyword = 'when';
          whenCount++;
          if (whenCount > 1 && firstViolationLine === 0) {
            firstViolationLine = step.location.line;
          }
        } else if (keyword) {
          lastRealKeyword = keyword;
        }
      }

      if (whenCount > 1) {
        errors.push({
          message: `Scenario "${scenario.name}" contains ${whenCount} When statements (max 1)`,
          rule: name,
          line: firstViolationLine,
        });
      }
    }

    return errors;
  },
};
