import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import * as gherkinUtils from './utils/gherkin.js';

const name = 'keywords-in-logical-order';

export const keywordsInLogicalOrderRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }
    const errors: LintError[] = [];

    const simpleStepContainers = feature.children.filter(
      (child) => !!(child.background || child.scenario)
    );

    const ruleStepContainers = feature.children
      .filter((child) => child.rule)
      .flatMap((child) => child.rule!.children);

    const allStepContainers = simpleStepContainers.concat(ruleStepContainers);

    const keywordList = ['given', 'when', 'then'];

    for (const child of allStepContainers) {
      const node = child.background ?? child.scenario;
      if (!node) {
        continue;
      }

      let maxKeywordPosition: number | undefined;

      for (const step of node.steps) {
        const keyword = gherkinUtils.getLanguageInsensitiveKeyword(step, feature.language);
        const keywordPosition =
          keyword !== undefined ? keywordList.indexOf(keyword) : -1;

        if (keywordPosition === -1) {
          continue;
        }

        if (maxKeywordPosition !== undefined && keywordPosition < maxKeywordPosition) {
          const maxKeyword = keywordList[maxKeywordPosition];
          errors.push({
            message: `Step "${step.keyword}${step.text}" should not appear after step using keyword ${maxKeyword}`,
            rule: name,
            line: step.location.line,
          });
        }

        maxKeywordPosition =
          maxKeywordPosition !== undefined
            ? Math.max(maxKeywordPosition, keywordPosition)
            : keywordPosition;
      }
    }

    return errors;
  },
};
