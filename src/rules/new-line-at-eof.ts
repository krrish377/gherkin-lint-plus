import { last } from 'lodash-es';
import type { RuleDefinition } from './rule.js';

const name = 'new-line-at-eof';

const availableConfigs = ['yes', 'no'];

export const newLineAtEofRule: RuleDefinition = {
  name,
  availableConfigs,
  run(_feature, file, config) {
    if (typeof config !== 'string' || !availableConfigs.includes(config)) {
      throw new Error(
        `${name} requires an extra configuration value.\nAvailable configurations: ${availableConfigs.join(', ')}\nFor syntax please look at the documentation.`
      );
    }

    const hasNewLineAtEOF = last(file.lines) === '';
    let errormsg = '';
    if (hasNewLineAtEOF && config === 'no') {
      errormsg = 'New line at EOF(end of file) is not allowed';
    } else if (!hasNewLineAtEOF && config === 'yes') {
      errormsg = 'New line at EOF(end of file) is required';
    }

    if (errormsg !== '') {
      return [
        {
          message: errormsg,
          rule: name,
          line: file.lines.length,
        },
      ];
    }
    return [];
  },
};
