import path from 'node:path';
import { camelCase, kebabCase, merge, snakeCase, startCase } from 'lodash-es';
import type { RuleDefinition } from './rule.js';
import { asObjectConfig } from './rule.js';

const name = 'file-name';

const availableConfigs = { style: 'PascalCase' };

const checkers: Record<string, (filename: string) => string> = {
  PascalCase: (filename) => startCase(filename).replace(/ /g, ''),
  'Title Case': (filename) => startCase(filename),
  camelCase: (filename) => camelCase(filename),
  'kebab-case': (filename) => kebabCase(filename),
  snake_case: (filename) => snakeCase(filename),
};

export const fileNameRule: RuleDefinition = {
  name,
  availableConfigs,
  run(feature, file, config) {
    void feature;
    const configuration = merge({}, availableConfigs, asObjectConfig(config));
    const style = String(configuration.style);
    const filename = path.basename(file.relativePath, '.feature');
    const checker = checkers[style];
    if (!checker) {
      throw new Error(`style "${style}" not supported for file-name rule`);
    }
    const expected = checker(filename);
    if (filename === expected) {
      return [];
    }
    return [
      {
        message: `File names should be written in ${style} e.g. "${expected}.feature"`,
        rule: name,
        line: 0,
      },
    ];
  },
};
