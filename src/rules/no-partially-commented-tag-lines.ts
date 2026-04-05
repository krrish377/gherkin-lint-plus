import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { forEachTagHost } from './utils/walk.js';

const name = 'no-partially-commented-tag-lines';

function checkTags(
  node: { tags?: readonly { name: string; location: { line: number } }[] },
  errors: LintError[]
): void {
  for (const tag of node.tags ?? []) {
    if (tag.name.indexOf('#') > 0) {
      errors.push({
        message: 'Partially commented tag lines not allowed',
        rule: name,
        line: tag.location.line,
      });
    }
  }
}

export const noPartiallyCommentedTagLinesRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    forEachTagHost(feature, (node) => checkTags(node, errors));
    return errors;
  },
};
