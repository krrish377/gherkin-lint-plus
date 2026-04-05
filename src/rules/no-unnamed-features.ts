import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';

const name = 'no-unnamed-features';

export const noUnnamedFeaturesRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    const errors: LintError[] = [];
    if (!feature || !feature.name) {
      const location = feature ? feature.location.line : 0;
      errors.push({
        message: 'Missing Feature name',
        rule: name,
        line: location,
      });
    }
    return errors;
  },
};
