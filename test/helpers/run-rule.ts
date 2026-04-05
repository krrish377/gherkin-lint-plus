import type { RuleDefinition, RuleRunConfig } from '../../src/rules/rule.js';
import type { LintError } from '../../src/types.js';
import { parseFeatureSource } from './parse-feature.js';

export function runRule(
  rule: RuleDefinition,
  gherkin: string,
  config: RuleRunConfig = {},
  uri = 'test.feature'
): LintError[] {
  const { feature, file } = parseFeatureSource(uri, gherkin);
  const out = rule.run(feature, file, config);
  return out ?? [];
}
