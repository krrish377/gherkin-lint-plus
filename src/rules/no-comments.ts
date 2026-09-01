import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';

const name = 'no-comments';

export const noCommentsRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(_feature, file) {
    const errors: LintError[] = [];
    file.lines.forEach((line, index) => {
      if (line.trim().startsWith('#')) {
        errors.push({
          message: 'Comments are not allowed',
          rule: name,
          line: index + 1,
        });
      }
    });
    return errors;
  },
};
