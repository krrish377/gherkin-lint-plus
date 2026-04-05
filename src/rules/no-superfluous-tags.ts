import { intersectionBy } from 'lodash-es';
import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import * as gherkinUtils from './utils/gherkin.js';

const name = 'no-superfluous-tags';

function checkTags(
  child: { tags?: readonly { name: string; location: { line: number } }[]; keyword: string },
  parent: { tags?: readonly { name: string }[]; keyword: string },
  language: string,
  errors: LintError[]
): void {
  const superfluousTags = intersectionBy(child.tags ?? [], parent.tags ?? [], 'name');
  const childType = gherkinUtils.getNodeType(child, language);
  const parentType = gherkinUtils.getNodeType(parent, language);

  for (const tag of superfluousTags) {
    errors.push({
      message: `Tag duplication between ${childType} and its corresponding ${parentType}: ${tag.name}`,
      rule: name,
      line: tag.location.line,
    });
  }
}

export const noSuperfluousTagsRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];
    const language = feature.language;

    for (const fc of feature.children) {
      if (fc.rule) {
        const rule = fc.rule;
        checkTags(rule, feature, language, errors);
        for (const rc of rule.children) {
          if (rc.scenario) {
            const scenario = rc.scenario;
            checkTags(scenario, feature, language, errors);
            checkTags(scenario, rule, language, errors);
            for (const example of scenario.examples) {
              checkTags(example, feature, language, errors);
              checkTags(example, scenario, language, errors);
              checkTags(example, rule, language, errors);
            }
          }
        }
      } else if (fc.scenario) {
        const scenario = fc.scenario;
        checkTags(scenario, feature, language, errors);
        for (const example of scenario.examples) {
          checkTags(example, feature, language, errors);
          checkTags(example, scenario, language, errors);
        }
      }
    }

    return errors;
  },
};
