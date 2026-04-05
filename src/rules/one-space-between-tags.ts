import type { Tag } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { forEachTagHost } from './utils/walk.js';

const name = 'one-space-between-tags';

function testTags(node: { tags?: readonly Tag[] }, errors: LintError[]): void {
  const byLine = new Map<number, Tag[]>();
  for (const tag of node.tags ?? []) {
    const line = tag.location.line;
    const list = byLine.get(line) ?? [];
    list.push(tag);
    byLine.set(line, list);
  }

  for (const tags of byLine.values()) {
    const sorted = [...tags].sort(
      (a, b) => (a.location.column ?? 1) - (b.location.column ?? 1)
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i]!;
      const b = sorted[i + 1]!;
      const ac = a.location.column ?? 1;
      const bc = b.location.column ?? 1;
      if (ac + a.name.length < bc - 1) {
        errors.push({
          line: a.location.line,
          rule: name,
          message: `There is more than one space between the tags ${a.name} and ${b.name}`,
        });
      }
    }
  }
}

export const oneSpaceBetweenTagsRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    forEachTagHost(feature, (node) => testTags(node, errors));
    return errors;
  },
};
