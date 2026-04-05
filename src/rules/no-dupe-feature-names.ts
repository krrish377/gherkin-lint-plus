import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { duplicateFeatureNames } from './duplicate-state.js';

const name = 'no-dupe-feature-names';

export const noDupeFeatureNamesRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature, file) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    const featureName = feature.name;
    if (Object.prototype.hasOwnProperty.call(duplicateFeatureNames, featureName)) {
      const dupes = duplicateFeatureNames[featureName]!.files.join(', ');
      duplicateFeatureNames[featureName]!.files.push(file.relativePath);
      errors.push({
        message: `Feature name is already used in: ${dupes}`,
        rule: name,
        line: feature.location.line,
      });
    } else {
      duplicateFeatureNames[featureName] = { files: [file.relativePath] };
    }
    return errors;
  },
};
