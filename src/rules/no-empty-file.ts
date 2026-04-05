import type { RuleDefinition } from './rule.js';

const name = 'no-empty-file';

export const noEmptyFileRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature, file) {
    const raw = file.lines.join('\n');
    if (raw.trim() === '' || feature === undefined) {
      return [
        {
          message: 'Empty feature files are disallowed',
          rule: name,
          line: 1,
        },
      ];
    }
    return undefined;
  },
};
