import { map } from 'lodash-es';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { forEachScenario } from './utils/walk.js';

const name = 'no-homogenous-tags';

function intersection(arrays: string[][]): string[] {
  if (arrays.length === 0) {
    return [];
  }
  let acc = [...arrays[0]!];
  for (let i = 1; i < arrays.length; i++) {
    acc = acc.filter((x) => arrays[i]!.includes(x));
  }
  return acc;
}

function getTagNames(node: { tags?: readonly { name: string }[] }): string[] {
  return map(node.tags ?? [], (tag) => tag.name);
}

export const noHomogenousTagsRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    const childrenTags: string[][] = [];

    forEachScenario(feature, (scenario) => {
      childrenTags.push(getTagNames(scenario));

      const exampleTags: string[][] = [];
      for (const example of scenario.examples) {
        exampleTags.push(getTagNames(example));
      }

      const homogenousExampleTags = intersection(exampleTags);
      if (homogenousExampleTags.length > 0) {
        errors.push({
          message:
            'All Examples of a Scenario Outline have the same tag(s), they should be defined on the Scenario Outline instead: ' +
            homogenousExampleTags.join(', '),
          rule: name,
          line: scenario.location.line,
        });
      }
    });

    const homogenousTags = intersection(childrenTags);
    if (homogenousTags.length > 0) {
      errors.push({
        message:
          'All Scenarios on this Feature have the same tag(s), they should be defined on the Feature instead: ' +
          homogenousTags.join(', '),
        rule: name,
        line: feature.location.line,
      });
    }

    return errors;
  },
};
