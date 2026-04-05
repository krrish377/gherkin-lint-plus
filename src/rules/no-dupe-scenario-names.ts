import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { duplicateScenarioNames, resetDuplicateScenarioState } from './duplicate-state.js';
import { forEachScenario } from './utils/walk.js';

const name = 'no-dupe-scenario-names';

function getFileLinePairsAsStr(objects: { file: string; line: number }[]): string {
  return objects.map((o) => `${o.file}:${o.line}`).join(', ');
}

export const noDupeScenarioNamesRule: RuleDefinition = {
  name,
  availableConfigs: ['anywhere', 'in-feature'],
  run(feature, file, config) {
    if (!feature) {
      return [];
    }
    if (config === 'in-feature') {
      resetDuplicateScenarioState();
    }

    const errors: LintError[] = [];

    forEachScenario(feature, (scenario) => {
      const scenarioName = scenario.name;
      if (Object.prototype.hasOwnProperty.call(duplicateScenarioNames, scenarioName)) {
        const dupes = getFileLinePairsAsStr(duplicateScenarioNames[scenarioName]!.locations);
        duplicateScenarioNames[scenarioName]!.locations.push({
          file: file.relativePath,
          line: scenario.location.line,
        });
        errors.push({
          message: `Scenario name is already used in: ${dupes}`,
          rule: name,
          line: scenario.location.line,
        });
      } else {
        duplicateScenarioNames[scenarioName] = {
          locations: [
            {
              file: file.relativePath,
              line: scenario.location.line,
            },
          ],
        };
      }
    });

    return errors;
  },
};
