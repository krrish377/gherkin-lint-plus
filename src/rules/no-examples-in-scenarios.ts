import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import * as gherkinUtils from './utils/gherkin.js';
import { forEachScenario } from './utils/walk.js';

const name = 'no-examples-in-scenarios';

export const noExamplesInScenariosRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    forEachScenario(feature, (scenario) => {
      const nodeType = gherkinUtils.getNodeType(scenario, feature.language);
      if (nodeType === 'Scenario' && scenario.examples.length > 0) {
        errors.push({
          message:
            'Cannot use "Examples" in a "Scenario", use a "Scenario Outline" instead',
          rule: name,
          line: scenario.location.line,
        });
      }
    });
    return errors;
  },
};
