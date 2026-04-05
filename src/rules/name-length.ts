import { merge } from 'lodash-es';
import type { Location } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { asObjectConfig } from './rule.js';

const name = 'name-length';

const availableConfigs = {
  Feature: 70,
  Rule: 70,
  Step: 70,
  Scenario: 70,
};

function test(
  n: string,
  location: Location,
  configuration: Record<string, number>,
  type: string,
  errors: LintError[]
): void {
  if (n && n.length > configuration[type]!) {
    errors.push({
      message: `${type} name is too long. Length of ${n.length} is longer than the maximum allowed: ${configuration[type]}`,
      rule: name,
      line: location.line,
    });
  }
}

export const nameLengthRule: RuleDefinition = {
  name,
  availableConfigs,
  run(feature, _file, config) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    const mergedConfiguration = merge(
      {},
      availableConfigs,
      asObjectConfig(config)
    ) as Record<string, number>;

    test(feature.name, feature.location, mergedConfiguration, 'Feature', errors);

    for (const child of feature.children) {
      if (child.rule) {
        test(child.rule.name, child.rule.location, mergedConfiguration, 'Rule', errors);
        for (const rc of child.rule.children) {
          if (rc.background) {
            for (const step of rc.background.steps) {
              test(step.text, step.location, mergedConfiguration, 'Step', errors);
            }
          } else if (rc.scenario) {
            test(
              rc.scenario.name,
              rc.scenario.location,
              mergedConfiguration,
              'Scenario',
              errors
            );
            for (const step of rc.scenario.steps) {
              test(step.text, step.location, mergedConfiguration, 'Step', errors);
            }
          }
        }
      } else if (child.background) {
        for (const step of child.background.steps) {
          test(step.text, step.location, mergedConfiguration, 'Step', errors);
        }
      } else if (child.scenario) {
        test(
          child.scenario.name,
          child.scenario.location,
          mergedConfiguration,
          'Scenario',
          errors
        );
        for (const step of child.scenario.steps) {
          test(step.text, step.location, mergedConfiguration, 'Step', errors);
        }
      }
    }

    return errors;
  },
};
