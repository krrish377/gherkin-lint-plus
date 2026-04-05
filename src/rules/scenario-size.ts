import { isEmpty, merge } from 'lodash-es';
import type { Background, Scenario } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { asObjectConfig } from './rule.js';
import * as gherkinUtils from './utils/gherkin.js';

const name = 'scenario-size';

const availableConfigs = {
  'steps-length': {
    Rule: 15,
    Background: 15,
    Scenario: 15,
  },
};

function checkSteps(
  node: Background | Scenario,
  featureLanguage: string,
  maxSize: number,
  errors: LintError[]
): void {
  if (node.steps.length > maxSize) {
    const nodeType = gherkinUtils.getNodeType(node, featureLanguage);
    errors.push({
      message: `Element ${nodeType} too long: actual ${node.steps.length}, expected ${maxSize}`,
      rule: name,
      line: node.location.line,
    });
  }
}

export const scenarioSizeRule: RuleDefinition = {
  name,
  availableConfigs,
  run(feature, _unused, config) {
    if (!feature) {
      return [];
    }

    let configuration: Record<string, { Rule: number; Background: number; Scenario: number }> =
      merge({}, availableConfigs);
    const obj = asObjectConfig(config);
    if (!isEmpty(obj)) {
      configuration = merge(configuration, obj) as typeof configuration;
    }

    const errs: LintError[] = [];

    for (const child of feature.children) {
      if (child.rule) {
        const maxSize = configuration['steps-length']!.Rule;
        if (maxSize) {
          for (const rc of child.rule.children) {
            const node = rc.background ?? rc.scenario;
            if (node) {
              checkSteps(node, feature.language, maxSize, errs);
            }
          }
        }
      } else {
        const node = child.background ?? child.scenario;
        if (!node) {
          continue;
        }
        const configKey = child.background ? 'Background' : 'Scenario';
        const maxSize = configuration['steps-length']![configKey];
        if (maxSize) {
          checkSteps(node, feature.language, maxSize, errs);
        }
      }
    }

    return errs;
  },
};
