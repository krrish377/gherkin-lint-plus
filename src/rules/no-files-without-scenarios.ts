import type { FeatureChild } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';

const name = 'no-files-without-scenarios';

function filterScenarios(child: FeatureChild): boolean {
  if (child.scenario !== undefined) {
    return true;
  }
  if (child.rule === undefined) {
    return false;
  }
  return child.rule.children.some(filterScenarios);
}

export const noFilesWithoutScenariosRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    if (!feature.children.some(filterScenarios)) {
      return [
        {
          message: 'Feature file does not have any Scenarios',
          rule: name,
          line: 1,
        },
      ];
    }
    return [];
  },
};
