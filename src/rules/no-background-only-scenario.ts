import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';

const name = 'no-background-only-scenario';

export const noBackgroundOnlyScenarioRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];

    for (const fc of feature.children) {
      if (fc.background && feature.children.length <= 2) {
        errors.push({
          message: 'Backgrounds are not allowed when there is just one scenario.',
          rule: name,
          line: fc.background.location.line,
        });
      }
      if (fc.rule) {
        const rule = fc.rule;
        if (rule.children.length <= 2) {
          for (const rc of rule.children) {
            if (rc.background) {
              errors.push({
                message: 'Backgrounds are not allowed when there is just one scenario.',
                rule: name,
                line: rc.background.location.line,
              });
            }
          }
        }
      }
    }

    return errors;
  },
};
