import { find } from 'lodash-es';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import * as gherkinUtils from './utils/gherkin.js';
import { forEachScenario } from './utils/walk.js';

const name = 'no-scenario-outlines-without-examples';

export const noScenarioOutlinesWithoutExamplesRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    forEachScenario(feature, (scenario) => {
      const nodeType = gherkinUtils.getNodeType(scenario, feature.language);
      const found = find(scenario.examples, 'tableBody') as
        | { tableBody?: { length: number } }
        | undefined;
      const invalid =
        nodeType === 'Scenario Outline' &&
        (!found || !found.tableBody || !found.tableBody.length);
      if (invalid) {
        errors.push({
          message: 'Scenario Outline does not have any Examples',
          rule: name,
          line: scenario.location.line,
        });
      }
    });
    return errors;
  },
};
