import { groupBy, merge, sortBy } from 'lodash-es';
import type { Location, Step, Tag } from '@cucumber/messages';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { asObjectConfig } from './rule.js';
import * as gherkinUtils from './utils/gherkin.js';

const name = 'indentation';

const defaultConfig: Record<string, number> = {
  Feature: 0,
  Background: 0,
  Rule: 0,
  Scenario: 0,
  Step: 2,
  Examples: 0,
  example: 2,
  given: 2,
  when: 2,
  then: 2,
  and: 2,
  but: 2,
};

const availableConfigs = merge({}, defaultConfig, {
  'feature tag': -1,
  'scenario tag': -1,
});

function mergeConfiguration(configuration: Record<string, unknown>): Record<string, number> {
  const merged = merge({}, defaultConfig, configuration) as Record<string, number>;
  if (!Object.prototype.hasOwnProperty.call(merged, 'feature tag')) {
    merged['feature tag'] = merged.Feature ?? 0;
  }
  if (!Object.prototype.hasOwnProperty.call(merged, 'scenario tag')) {
    merged['scenario tag'] = merged.Scenario ?? 0;
  }
  return merged;
}

export const indentationRule: RuleDefinition = {
  name,
  availableConfigs,
  run(feature, _file, config) {
    if (!feature) {
      return [];
    }
    const rawConfig = asObjectConfig(config);
    const mergedConfiguration = mergeConfiguration(rawConfig);
    const errors: LintError[] = [];

    function test(parsedLocation: Location, type: string): void {
      const col = parsedLocation.column ?? 1;
      if (col - 1 !== mergedConfiguration[type]) {
        errors.push({
          message:
            `Wrong indentation for "${type}", expected indentation level of ${mergedConfiguration[type]}, but got ${col - 1}`,
          rule: name,
          line: parsedLocation.line,
        });
      }
    }

    function testStep(step: Step): void {
      let stepType = gherkinUtils.getLanguageInsensitiveKeyword(step, feature!.language);
      stepType =
        stepType !== undefined && stepType in rawConfig ? stepType : 'Step';
      test(step.location, stepType);
    }

    function testTags(tags: readonly Tag[] | undefined, type: string): void {
      const byLine = groupBy(tags ?? [], (t) => t.location.line);
      for (const group of Object.values(byLine)) {
        const firstTag = sortBy(group, (t) => t.location.column)[0];
        if (firstTag) {
          test(firstTag.location, type);
        }
      }
    }

    test(feature.location, 'Feature');
    testTags(feature.tags, 'feature tag');

    for (const child of feature.children) {
      if (child.rule) {
        test(child.rule.location, 'Rule');
        testTags(child.rule.tags, 'scenario tag');
        for (const rc of child.rule.children) {
          if (rc.background) {
            test(rc.background.location, 'Background');
            for (const step of rc.background.steps) {
              testStep(step);
            }
          } else if (rc.scenario) {
            test(rc.scenario.location, 'Scenario');
            testTags(rc.scenario.tags, 'scenario tag');
            for (const step of rc.scenario.steps) {
              testStep(step);
            }
            for (const examples of rc.scenario.examples) {
              test(examples.location, 'Examples');
              if (examples.tableHeader) {
                test(examples.tableHeader.location, 'example');
                for (const row of examples.tableBody) {
                  test(row.location, 'example');
                }
              }
            }
          }
        }
      } else if (child.background) {
        test(child.background.location, 'Background');
        for (const step of child.background.steps) {
          testStep(step);
        }
      } else if (child.scenario) {
        test(child.scenario.location, 'Scenario');
        testTags(child.scenario.tags, 'scenario tag');
        for (const step of child.scenario.steps) {
          testStep(step);
        }
        for (const examples of child.scenario.examples) {
          test(examples.location, 'Examples');
          if (examples.tableHeader) {
            test(examples.tableHeader.location, 'example');
            for (const row of examples.tableBody) {
              test(row.location, 'example');
            }
          }
        }
      }
    }

    return errors;
  },
};
