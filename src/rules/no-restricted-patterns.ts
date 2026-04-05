import type { Background, Feature, Scenario } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { asObjectConfig } from './rule.js';
import * as gherkinUtils from './utils/gherkin.js';

const name = 'no-restricted-patterns';

const availableConfigs = {
  Global: [],
  Scenario: [],
  ScenarioOutline: [],
  Background: [],
  Feature: [],
  Rule: [],
};

function getRestrictedPatterns(configuration: Record<string, unknown>): Record<string, RegExp[]> {
  const globalPatterns = ((configuration.Global as string[] | undefined) ?? []).map(
    (pattern) => new RegExp(pattern, 'i')
  );

  const restrictedPatterns: Record<string, RegExp[]> = {};
  for (const key of Object.keys(availableConfigs)) {
    const resolvedKey = key.toLowerCase().replace(/ /g, '');
    const resolvedConfig = (configuration[key] as string[] | undefined) ?? [];
    restrictedPatterns[resolvedKey] = resolvedConfig
      .map((pattern) => new RegExp(pattern, 'i'))
      .concat(globalPatterns);
  }

  return restrictedPatterns;
}

function getRestrictedPatternsForNode(
  node: { keyword: string },
  restrictedPatterns: Record<string, RegExp[]>,
  language: string
): RegExp[] {
  const key =
    gherkinUtils.getLanguageInsensitiveKeyword(node, language)?.toLowerCase() ?? '';
  return restrictedPatterns[key] ?? [];
}

function checkNameAndDescription(
  node: { keyword: string; name: string; description: string; location: { line: number } },
  restrictedPatterns: Record<string, RegExp[]>,
  language: string,
  errors: LintError[]
): void {
  for (const pattern of getRestrictedPatternsForNode(node, restrictedPatterns, language)) {
    check(node, 'name', pattern, language, errors);
    check(node, 'description', pattern, language, errors);
  }
}

function checkStepNode(
  node: { text: string; location: { line: number } },
  parentNode: { keyword: string },
  restrictedPatterns: Record<string, RegExp[]>,
  language: string,
  errors: LintError[]
): void {
  for (const pattern of getRestrictedPatternsForNode(parentNode, restrictedPatterns, language)) {
    check(node, 'text', pattern, language, errors);
  }
}

function check(
  node: { keyword?: string; name?: string; description?: string; text?: string; location: { line: number } },
  property: 'name' | 'description' | 'text',
  pattern: RegExp,
  language: string,
  errors: LintError[]
): void {
  const value = node[property];
  if (!value) {
    return;
  }

  let strings = [value];
  const type = node.keyword
    ? gherkinUtils.getNodeType(node as { keyword: string }, language)
    : '';

  if (property === 'description') {
    const escapedNewLineSentinel = '<!gherkin-lint new line sentinel!>';
    const escapedNewLine = '\\n';
    strings = value
      .replace(escapedNewLine, escapedNewLineSentinel)
      .split('\n')
      .map((s) => s.replace(escapedNewLineSentinel, escapedNewLine));
  }

  for (const s of strings) {
    if (s.trim().match(pattern)) {
      errors.push({
        message: `${type} ${property}: "${s.trim()}" matches restricted pattern "${pattern}"`,
        rule: name,
        line: node.location.line,
      });
    }
  }
}

function lintBackgroundOrScenario(
  node: Background | Scenario,
  restrictedPatterns: Record<string, RegExp[]>,
  language: string,
  errors: LintError[]
): void {
  checkNameAndDescription(node, restrictedPatterns, language, errors);
  for (const step of node.steps) {
    checkStepNode(step, node, restrictedPatterns, language, errors);
  }
}

function lintFeatureChildren(
  feature: Feature,
  restrictedPatterns: Record<string, RegExp[]>,
  errors: LintError[]
): void {
  const language = feature.language;
  for (const fc of feature.children) {
    if (fc.rule) {
      checkNameAndDescription(fc.rule, restrictedPatterns, language, errors);
      for (const rc of fc.rule.children) {
        if (rc.background) {
          lintBackgroundOrScenario(rc.background, restrictedPatterns, language, errors);
        }
        if (rc.scenario) {
          lintBackgroundOrScenario(rc.scenario, restrictedPatterns, language, errors);
        }
      }
    } else {
      const node = fc.background ?? fc.scenario;
      if (node) {
        lintBackgroundOrScenario(node, restrictedPatterns, language, errors);
      }
    }
  }
}

export const noRestrictedPatternsRule: RuleDefinition = {
  name,
  availableConfigs,
  run(feature, _unused, config) {
    if (!feature) {
      return [];
    }
    const configuration = asObjectConfig(config);
    const errors: LintError[] = [];
    const restrictedPatterns = getRestrictedPatterns(configuration);
    const language = feature.language;

    checkNameAndDescription(feature, restrictedPatterns, language, errors);
    lintFeatureChildren(feature, restrictedPatterns, errors);

    return errors;
  },
};
