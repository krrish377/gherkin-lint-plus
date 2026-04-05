import { merge } from 'lodash-es';
import type { Tag } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { asObjectConfig } from './rule.js';
import * as gherkinUtils from './utils/gherkin.js';
import { forEachScenario } from './utils/walk.js';

const name = 'required-tags';

const availableConfigs = {
  tags: [] as string[],
  ignoreUntagged: true,
};

function checkTagExists(
  requiredTag: string,
  ignoreUntagged: boolean,
  scenarioTags: readonly Tag[],
  scenarioType: string,
  scenarioLine: number
): LintError | true {
  const result =
    (ignoreUntagged && scenarioTags.length === 0) ||
    scenarioTags.some((tagObj) => new RegExp(requiredTag).test(tagObj.name));
  if (!result) {
    return {
      message: `No tag found matching ${requiredTag} for ${scenarioType}`,
      rule: name,
      line: scenarioLine,
    };
  }
  return true;
}

export const requiredTagsRule: RuleDefinition = {
  name,
  availableConfigs,
  run(feature, _unused, config) {
    if (!feature) {
      return [];
    }

    const mergedConfig = merge({}, availableConfigs, asObjectConfig(config));
    const errors: LintError[] = [];

    forEachScenario(feature, (scenario) => {
      const type = gherkinUtils.getNodeType(scenario, feature.language);
      const line = scenario.location.line;

      const requiredTagErrors = (mergedConfig.tags as string[])
        .map((requiredTag) =>
          checkTagExists(
            requiredTag,
            mergedConfig.ignoreUntagged as boolean,
            scenario.tags ?? [],
            type,
            line
          )
        )
        .filter(
          (item): item is LintError =>
            typeof item === 'object' && item !== null && 'message' in item
        );

      errors.push(...requiredTagErrors);
    });

    return errors;
  },
};
