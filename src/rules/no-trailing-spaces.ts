import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';

const name = 'no-trailing-spaces';

export const noTrailingSpacesRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(_feature, file) {
    const errors: LintError[] = [];
    let lineNo = 1;
    for (const line of file.lines) {
      if (/[\t ]+$/.test(line)) {
        errors.push({
          message: 'Trailing spaces are not allowed',
          rule: name,
          line: lineNo,
        });
      }
      lineNo++;
    }
    return errors;
  },
};
