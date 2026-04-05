import type { LinterConfiguration, RuleConfigValue } from './types.js';
import { doesRuleExist, getRule, isMandatoryRule } from './rules/registry.js';

function verifyRuleConfiguration(
  rule: string,
  ruleConfig: RuleConfigValue,
  additionalRulesDirs: string[],
  errors: string[]
): void {
  if (isMandatoryRule(rule)) {
    if (ruleConfig === 'off' || (Array.isArray(ruleConfig) && ruleConfig[0] === 'off')) {
      errors.push(`Rule "${rule}" is mandatory and cannot be turned off`);
      return;
    }
  }

  const genericErrorMsg = `Invalid rule configuration for "${rule}" - `;
  const enablingSettings = ['on', 'off'];

  if (Array.isArray(ruleConfig)) {
    if (!enablingSettings.includes(ruleConfig[0] ?? '')) {
      errors.push(genericErrorMsg + 'The first part of the config should be "on" or "off"');
    }
    if (ruleConfig.length !== 2) {
      errors.push(genericErrorMsg + ' The config should only have 2 parts.');
    }

    const ruleObj = getRule(rule, additionalRulesDirs);
    if (!ruleObj) {
      return;
    }

    if (typeof ruleConfig[1] === 'string') {
      const ok =
        Array.isArray(ruleObj.availableConfigs) &&
        ruleObj.availableConfigs.includes(ruleConfig[1]);
      if (!ok) {
        errors.push(
          genericErrorMsg +
            ` The rule does not have the specified configuration option "${ruleConfig[1]}"`
        );
      }
    } else if (typeof ruleConfig[1] === 'object' && ruleConfig[1] !== null) {
      for (const subConfig of Object.keys(ruleConfig[1])) {
        const ok =
          typeof ruleObj.availableConfigs === 'object' &&
          !Array.isArray(ruleObj.availableConfigs) &&
          ruleObj.availableConfigs[subConfig] !== undefined;
        if (!ok) {
          errors.push(
            genericErrorMsg +
              ` The rule does not have the specified configuration option "${subConfig}"`
          );
        }
      }
    }
  } else if (!enablingSettings.includes(ruleConfig)) {
    errors.push(genericErrorMsg + 'The config should be "on" or "off"');
  }
}

export function verifyConfigurationFile(
  config: LinterConfiguration,
  additionalRulesDirs: string[]
): string[] {
  const errors: string[] = [];
  for (const ruleName of Object.keys(config)) {
    if (!doesRuleExist(ruleName, additionalRulesDirs)) {
      errors.push(`Rule "${ruleName}" does not exist`);
    } else {
      verifyRuleConfiguration(ruleName, config[ruleName]!, additionalRulesDirs, errors);
    }
  }
  return errors;
}
