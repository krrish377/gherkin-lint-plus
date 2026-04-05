import { includes } from 'lodash-es';
import type { Tag } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import { asObjectConfig } from './rule.js';
import type { LintError } from '../types.js';
import { forEachTagHost } from './utils/walk.js';

const name = 'allowed-tags';

function getAllowedPatterns(configuration: Record<string, unknown>): RegExp[] {
  const patterns = configuration.patterns;
  if (!Array.isArray(patterns)) {
    return [];
  }
  return patterns.map((p) => new RegExp(String(p)));
}

function checkTags(
  node: { keyword: string; tags?: readonly Tag[] },
  allowedTags: string[],
  allowedPatterns: RegExp[],
  errors: LintError[]
): void {
  for (const tag of node.tags ?? []) {
    if (!isAllowed(tag, allowedTags, allowedPatterns)) {
      errors.push({
        message: `Not allowed tag ${tag.name} on ${node.keyword}`,
        rule: name,
        line: tag.location.line,
      });
    }
  }
}

function isAllowed(tag: Tag, allowedTags: string[], allowedPatterns: RegExp[]): boolean {
  return includes(allowedTags, tag.name) || allowedPatterns.some((p) => p.test(tag.name));
}

export const allowedTagsRule: RuleDefinition = {
  name,
  availableConfigs: { tags: [], patterns: [] },
  run(feature, _file, config) {
    if (!feature) {
      return [];
    }
    const configuration = asObjectConfig(config);
    const allowedTags = (configuration.tags as string[] | undefined) ?? [];
    const allowedPatterns = getAllowedPatterns(configuration);
    const errors: LintError[] = [];

    forEachTagHost(feature, (node) => {
      checkTags(node, allowedTags, allowedPatterns, errors);
    });

    return errors;
  },
};
