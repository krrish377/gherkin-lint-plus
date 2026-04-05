import type { RuleDefinition } from './rule.js';
import type { LintError } from '../types.js';
import { forEachScenario } from './utils/walk.js';

const name = 'no-unused-variables';

export const noUnusedVariablesRule: RuleDefinition = {
  name,
  availableConfigs: [],
  run(feature) {
    if (!feature) {
      return [];
    }

    const errors: LintError[] = [];

    forEachScenario(feature, (child) => {
      const stepVariableRegex = /<([^>]*)>/gu;
      const examples = child.examples;

      if (examples.length === 0) {
        return;
      }

      const examplesVariables: Record<string, number> = {};
      const scenarioVariables: Record<string, number> = {};
      let match: RegExpExecArray | null;

      for (const example of examples) {
        if (example.tableHeader?.cells) {
          for (const cell of example.tableHeader.cells) {
            if (cell.value) {
              examplesVariables[cell.value] = cell.location.line;
            }
          }
        }
      }

      while ((match = stepVariableRegex.exec(child.name)) != null) {
        scenarioVariables[match[1]!] = child.location.line;
      }

      for (const step of child.steps) {
        if (step.dataTable) {
          for (const row of step.dataTable.rows) {
            for (const cell of row.cells) {
              if (cell.value) {
                stepVariableRegex.lastIndex = 0;
                while ((match = stepVariableRegex.exec(cell.value)) != null) {
                  scenarioVariables[match[1]!] = cell.location.line;
                }
              }
            }
          }
        } else if (step.docString) {
          stepVariableRegex.lastIndex = 0;
          while ((match = stepVariableRegex.exec(step.docString.content)) != null) {
            scenarioVariables[match[1]!] = step.location.line;
          }
        }

        stepVariableRegex.lastIndex = 0;
        while ((match = stepVariableRegex.exec(step.text)) != null) {
          scenarioVariables[match[1]!] = step.location.line;
        }
      }

      for (const exampleVariable of Object.keys(examplesVariables)) {
        if (!scenarioVariables[exampleVariable]) {
          errors.push({
            message: `Examples table variable "${exampleVariable}" is not used in any step`,
            rule: name,
            line: examplesVariables[exampleVariable]!,
          });
        }
      }

      for (const scenarioVariable of Object.keys(scenarioVariables)) {
        if (!examplesVariables[scenarioVariable]) {
          errors.push({
            message: `Step variable "${scenarioVariable}" does not exist in the examples table`,
            rule: name,
            line: scenarioVariables[scenarioVariable]!,
          });
        }
      }
    });

    return errors;
  },
};
