import { merge } from 'lodash-es';
import type { Feature } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import { asObjectConfig } from './rule.js';
import { forEachScenario } from './utils/walk.js';

const name = 'max-scenarios-per-file';

const defaultConfig = {
  maxScenarios: 10,
  countOutlineExamples: true,
};

function countScenarioContributions(feature: Feature, countOutlineExamples: boolean): number {
  let count = 0;
  forEachScenario(feature, (scenario) => {
    if (scenario.examples.length > 0 && countOutlineExamples) {
      let rows = 0;
      for (const example of scenario.examples) {
        rows += example.tableBody?.length ?? 0;
      }
      count += rows;
    } else {
      count += 1;
    }
  });
  return count;
}

export const maxScenariosPerFileRule: RuleDefinition = {
  name,
  availableConfigs: defaultConfig,
  run(feature, _file, config) {
    if (!feature) {
      return [];
    }
    const mergedConfiguration = merge({}, defaultConfig, asObjectConfig(config));
    const maxScenarios = Number(mergedConfiguration.maxScenarios);
    const count = countScenarioContributions(
      feature,
      Boolean(mergedConfiguration.countOutlineExamples)
    );

    if (count > maxScenarios) {
      return [
        {
          message: `Number of scenarios exceeds maximum: ${count}/${maxScenarios}`,
          rule: name,
          line: 0,
        },
      ];
    }
    return [];
  },
};
