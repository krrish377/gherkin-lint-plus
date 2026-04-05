import { includes } from 'lodash-es';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { asObjectConfig } from './rule.js';
import * as gherkinUtils from './utils/gherkin.js';
import { forEachTagHost } from './utils/walk.js';

const name = 'no-restricted-tags';

function getForbiddenPatterns(configuration: Record<string, unknown>): RegExp[] {
  const patterns = configuration.patterns;
  if (!Array.isArray(patterns)) {
    return [];
  }
  return patterns.map((p) => new RegExp(String(p)));
}

function isForbidden(
  tag: { name: string },
  forbiddenTags: string[],
  forbiddenPatterns: RegExp[]
): boolean {
  return includes(forbiddenTags, tag.name) || forbiddenPatterns.some((p) => p.test(tag.name));
}

function checkTags(
  node: { tags?: readonly { name: string; location: { line: number } }[]; keyword: string },
  language: string,
  forbiddenTags: string[],
  forbiddenPatterns: RegExp[],
  errors: LintError[]
): void {
  const nodeType = gherkinUtils.getNodeType(node, language);
  for (const tag of node.tags ?? []) {
    if (isForbidden(tag, forbiddenTags, forbiddenPatterns)) {
      errors.push({
        message: `Forbidden tag ${tag.name} on ${nodeType}`,
        rule: name,
        line: tag.location.line,
      });
    }
  }
}

export const noRestrictedTagsRule: RuleDefinition = {
  name,
  availableConfigs: { tags: [], patterns: [] },
  run(feature, _unused, config) {
    if (!feature) {
      return [];
    }
    const configuration = asObjectConfig(config);
    const forbiddenTags = (configuration.tags as string[] | undefined) ?? [];
    const forbiddenPatterns = getForbiddenPatterns(configuration);
    const errors: LintError[] = [];
    const language = feature.language;

    forEachTagHost(feature, (node) => {
      checkTags(node, language, forbiddenTags, forbiddenPatterns, errors);
    });

    return errors;
  },
};
