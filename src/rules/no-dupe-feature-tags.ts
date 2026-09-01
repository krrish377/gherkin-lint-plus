import { merge } from 'lodash-es';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { asObjectConfig } from './rule.js';
import { duplicateFeatureTags } from './duplicate-state.js';

const name = 'no-dupe-feature-tags';

const availableConfigs = {
  tags: [] as string[],
};

export const noDupeFeatureTagsRule: RuleDefinition = {
  name,
  availableConfigs,
  run(feature, file, config) {
    if (!feature) {
      return [];
    }

    const mergedConfig = merge({}, availableConfigs, asObjectConfig(config));
    const patterns = mergedConfig.tags as string[];
    const errors: LintError[] = [];

    for (const tag of feature.tags ?? []) {
      if (!patterns.some((pattern) => new RegExp(pattern).test(tag.name))) {
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(duplicateFeatureTags, tag.name)) {
        const dupes = duplicateFeatureTags[tag.name]!.files.join(', ');
        duplicateFeatureTags[tag.name]!.files.push(file.relativePath);
        errors.push({
          message: `Tag ${tag.name} is already used in: ${dupes}`,
          rule: name,
          line: tag.location.line,
        });
      } else {
        duplicateFeatureTags[tag.name] = { files: [file.relativePath] };
      }
    }
    return errors;
  },
};
