import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { forEachScenario } from './utils/walk.js';

const name = 'no-unnamed-scenarios';

export const noUnnamedScenariosRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    forEachScenario(feature, (scenario) => {
      if (!scenario.name) {
        errors.push({
          message: 'Missing Scenario name',
          rule: name,
          line: scenario.location.line,
        });
      }
    });
    return errors;
  },
};
