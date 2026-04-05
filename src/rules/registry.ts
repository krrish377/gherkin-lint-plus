import type { RuleDefinition } from './rule.js';
import { loadCustomRulesFromDirectories } from './load-custom-rules.js';
import { allowedTagsRule } from './allowed-tags.js';
import { fileNameRule } from './file-name.js';
import { indentationRule } from './indentation.js';
import { keywordsInLogicalOrderRule } from './keywords-in-logical-order.js';
import { maxScenariosPerFileRule } from './max-scenarios-per-file.js';
import { nameLengthRule } from './name-length.js';
import { newLineAtEofRule } from './new-line-at-eof.js';
import { noBackgroundOnlyScenarioRule } from './no-background-only-scenario.js';
import { noDupeFeatureNamesRule } from './no-dupe-feature-names.js';
import { noDupeScenarioNamesRule } from './no-dupe-scenario-names.js';
import { noDuplicateTagsRule } from './no-duplicate-tags.js';
import { noEmptyBackgroundRule } from './no-empty-background.js';
import { noEmptyFileRule } from './no-empty-file.js';
import { noExamplesInScenariosRule } from './no-examples-in-scenarios.js';
import { noFilesWithoutScenariosRule } from './no-files-without-scenarios.js';
import { noHomogenousTagsRule } from './no-homogenous-tags.js';
import { noMultipleEmptyLinesRule } from './no-multiple-empty-lines.js';
import { noPartiallyCommentedTagLinesRule } from './no-partially-commented-tag-lines.js';
import { noRestrictedPatternsRule } from './no-restricted-patterns.js';
import { noRestrictedTagsRule } from './no-restricted-tags.js';
import { noScenarioOutlinesWithoutExamplesRule } from './no-scenario-outlines-without-examples.js';
import { noSuperfluousTagsRule } from './no-superfluous-tags.js';
import { noTrailingSpacesRule } from './no-trailing-spaces.js';
import { noUnnamedFeaturesRule } from './no-unnamed-features.js';
import { noUnnamedScenariosRule } from './no-unnamed-scenarios.js';
import { noUnusedVariablesRule } from './no-unused-variables.js';
import { oneSpaceBetweenTagsRule } from './one-space-between-tags.js';
import { onlyOneWhenRule } from './only-one-when.js';
import { requiredTagsRule } from './required-tags.js';
import { scenarioSizeRule } from './scenario-size.js';
import { useAndRule } from './use-and.js';

const builtIns: RuleDefinition[] = [
  allowedTagsRule,
  fileNameRule,
  indentationRule,
  keywordsInLogicalOrderRule,
  maxScenariosPerFileRule,
  nameLengthRule,
  newLineAtEofRule,
  noBackgroundOnlyScenarioRule,
  noDupeFeatureNamesRule,
  noDupeScenarioNamesRule,
  noDuplicateTagsRule,
  noEmptyBackgroundRule,
  noEmptyFileRule,
  noExamplesInScenariosRule,
  noFilesWithoutScenariosRule,
  noHomogenousTagsRule,
  noMultipleEmptyLinesRule,
  noPartiallyCommentedTagLinesRule,
  noRestrictedPatternsRule,
  noRestrictedTagsRule,
  noScenarioOutlinesWithoutExamplesRule,
  noSuperfluousTagsRule,
  noTrailingSpacesRule,
  noUnnamedFeaturesRule,
  noUnnamedScenariosRule,
  noUnusedVariablesRule,
  oneSpaceBetweenTagsRule,
  onlyOneWhenRule,
  requiredTagsRule,
  scenarioSizeRule,
  useAndRule,
];

/**
 * Always run for every file; config cannot set them to `"off"`.
 * They accept the same optional `["on", …]` options as when enabled explicitly.
 */
const MANDATORY_RULE_NAMES = new Set<string>([
  'no-empty-file',
  'no-files-without-scenarios',
  'no-unnamed-features',
  'no-unnamed-scenarios',
]);

export function isMandatoryRule(ruleName: string): boolean {
  return MANDATORY_RULE_NAMES.has(ruleName);
}

export function getMandatoryRuleNames(): readonly string[] {
  return [...MANDATORY_RULE_NAMES];
}

export function getBuiltInRules(): RuleDefinition[] {
  return builtIns;
}

let rulesMapCache: Map<string, RuleDefinition> | null = null;
let rulesMapCacheKey = '';

/** For tests that change rules directories between cases */
export function invalidateRulesMapCache(): void {
  rulesMapCache = null;
  rulesMapCacheKey = '';
}

export function getRulesMap(additionalRulesDirs: string[]): Map<string, RuleDefinition> {
  const key = additionalRulesDirs.join('\0');
  if (rulesMapCache && rulesMapCacheKey === key) {
    return rulesMapCache;
  }

  let customRules: RuleDefinition[];
  try {
    customRules = loadCustomRulesFromDirectories(additionalRulesDirs);
  } catch (e) {
    invalidateRulesMapCache();
    throw e;
  }

  const map = new Map<string, RuleDefinition>();
  for (const rule of builtIns) {
    map.set(rule.name, rule);
  }
  for (const rule of customRules) {
    map.set(rule.name, rule);
  }
  rulesMapCache = map;
  rulesMapCacheKey = key;
  return map;
}

export function doesRuleExist(ruleName: string, additionalRulesDirs: string[]): boolean {
  return getRulesMap(additionalRulesDirs).has(ruleName);
}

export function getRule(
  ruleName: string,
  additionalRulesDirs: string[]
): RuleDefinition | undefined {
  return getRulesMap(additionalRulesDirs).get(ruleName);
}
