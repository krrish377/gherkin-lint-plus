import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';

const name = 'no-multiple-empty-lines';

export const noMultipleEmptyLinesRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(_feature, file) {
    const errors: LintError[] = [];
    for (let i = 0; i < file.lines.length - 1; i++) {
      if (file.lines[i]!.trim() === '' && file.lines[i + 1]!.trim() === '') {
        errors.push({
          message: 'Multiple empty lines are not allowed',
          rule: name,
          line: i + 2,
        });
      }
    }
    return errors;
  },
};
