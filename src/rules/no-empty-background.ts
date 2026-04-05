import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';

const name = 'no-empty-background';

export const noEmptyBackgroundRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];

    for (const fc of feature.children) {
      if (fc.background && fc.background.steps.length === 0) {
        errors.push({
          message: 'Empty backgrounds are not allowed.',
          rule: name,
          line: fc.background.location.line,
        });
      }
      if (fc.rule) {
        for (const rc of fc.rule.children) {
          if (rc.background && rc.background.steps.length === 0) {
            errors.push({
              message: 'Empty backgrounds are not allowed.',
              rule: name,
              line: rc.background.location.line,
            });
          }
        }
      }
    }

    return errors;
  },
};
