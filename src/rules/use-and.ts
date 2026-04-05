import type { Feature } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import * as gherkinUtils from './utils/gherkin.js';

const name = 'use-and';

function lintSteps(
  feature: Feature,
  errors: LintError[],
  steps: readonly { keyword: string; text: string; location: { line: number } }[]
): void {
  let previousKeyword: string | undefined;
  for (const step of steps) {
    const keyword = gherkinUtils.getLanguageInsensitiveKeyword(step, feature.language);
    if (keyword === 'and') {
      continue;
    }
    if (keyword === previousKeyword) {
      errors.push({
        message: `Step "${step.keyword}${step.text}" should use And instead of ${step.keyword}`,
        rule: name,
        line: step.location.line,
      });
    }
    previousKeyword = keyword;
  }
}

export const useAndRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }

    const errors: LintError[] = [];

    for (const fc of feature.children) {
      if (fc.rule) {
        for (const rc of fc.rule.children) {
          const node = rc.background ?? rc.scenario;
          if (node?.steps.length) {
            lintSteps(feature, errors, node.steps);
          }
        }
      } else {
        const node = fc.background ?? fc.scenario;
        if (node?.steps.length) {
          lintSteps(feature, errors, node.steps);
        }
      }
    }

    return errors;
  },
};
