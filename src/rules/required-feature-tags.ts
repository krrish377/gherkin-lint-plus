import { merge } from 'lodash-es';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { asObjectConfig } from './rule.js';

const name = 'required-feature-tags';

const availableConfigs = {
  tags: [] as string[],
};

export const requiredFeatureTagsRule: RuleDefinition = {
  name,
  availableConfigs,
  run(feature, _file, config) {
    if (!feature) {
      return [];
    }

    const mergedConfig = merge({}, availableConfigs, asObjectConfig(config));
    const present = (feature.tags ?? []).map((tag) => tag.name);
    const line = feature.location.line;

    return (mergedConfig.tags as string[])
      .filter((required) => !present.some((tag) => new RegExp(required).test(tag)))
      .map<LintError>((required) => ({
        message: `No tag found matching ${required} on Feature`,
        rule: name,
        line,
      }));
  },
};
