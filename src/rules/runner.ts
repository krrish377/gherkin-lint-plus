import type { Feature } from '@cucumber/messages';
import type { FileLines, LintError, LinterConfiguration, RuleConfigValue } from '../types.js';
import type { RuleRunConfig } from './rule.js';
import { getRulesMap, isMandatoryRule } from './registry.js';

function isRuleExplicitlyOff(ruleConfig: RuleConfigValue | undefined): boolean {
  if (ruleConfig === 'off') {
    return true;
  }
  return Array.isArray(ruleConfig) && ruleConfig[0] === 'off';
}

function isRuleEnabled(ruleName: string, ruleConfig: RuleConfigValue | undefined): boolean {
  if (isMandatoryRule(ruleName)) {
    return true;
  }
  if (ruleConfig === undefined) {
    return false;
  }
  if (Array.isArray(ruleConfig)) {
    return ruleConfig[0] === 'on';
  }
  return ruleConfig === 'on';
}

/** Effective config passed to `run`; mandatory rules use `{}` when omitted or misconfigured as off (verifier should reject off). */
function getEffectiveRuleRunConfig(
  ruleName: string,
  ruleConfig: RuleConfigValue | undefined
): RuleRunConfig {
  if (!isMandatoryRule(ruleName)) {
    return getRuleRunConfig(ruleConfig);
  }
  if (ruleConfig === undefined || isRuleExplicitlyOff(ruleConfig)) {
    return {};
  }
  if (ruleConfig === 'on') {
    return {};
  }
  return getRuleRunConfig(ruleConfig);
}

export function getRuleRunConfig(ruleConfig: RuleConfigValue | undefined): RuleRunConfig {
  if (!ruleConfig || typeof ruleConfig === 'string') {
    return {};
  }
  if (Array.isArray(ruleConfig) && ruleConfig.length >= 2) {
    const second = ruleConfig[1];
    if (typeof second === 'string') {
      return second;
    }
    if (typeof second === 'object' && second !== null) {
      return second as Record<string, unknown>;
    }
  }
  return {};
}

export function runAllEnabledRules(
  feature: Feature | undefined,
  file: FileLines,
  configuration: LinterConfiguration,
  additionalRulesDirs: string[]
): LintError[] {
  const errors: LintError[] = [];
  const rules = getRulesMap(additionalRulesDirs);
  for (const [, rule] of rules) {
    const cfg = configuration[rule.name];
    if (!isRuleEnabled(rule.name, cfg)) {
      continue;
    }
    const out = rule.run(feature, file, getEffectiveRuleRunConfig(rule.name, cfg));
    if (out?.length) {
      errors.push(...out);
    }
  }
  return errors;
}
