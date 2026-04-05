import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { forEachTagHost } from './utils/walk.js';

const name = 'no-duplicate-tags';

function verifyTags(
  node: { tags?: readonly { name: string; location: { line: number } }[] },
  errors: LintError[]
): void {
  const failedTagNames: string[] = [];
  const uniqueTagNames: string[] = [];
  for (const tag of node.tags ?? []) {
    if (!failedTagNames.includes(tag.name)) {
      if (uniqueTagNames.includes(tag.name)) {
        errors.push({
          message: `Duplicate tags are not allowed: ${tag.name}`,
          rule: name,
          line: tag.location.line,
        });
        failedTagNames.push(tag.name);
      } else {
        uniqueTagNames.push(tag.name);
      }
    }
  }
}

export const noDuplicateTagsRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    forEachTagHost(feature, (node) => verifyTags(node, errors));
    return errors;
  },
};
