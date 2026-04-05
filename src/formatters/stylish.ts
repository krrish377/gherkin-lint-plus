import type { LintResult } from '../types.js';

const style = {
  gray(text: string): string {
    return `\x1b[38;5;243m${text}\x1b[0m`;
  },
  underline(text: string): string {
    return `\x1b[0;4m${text}\x1b[24m`;
  },
};

function stylizeFilePath(filePath: string): string {
  return style.underline(filePath);
}

function stylizeError(
  error: { line: number; message: string; rule: string },
  maxLineLength: number,
  maxMessageLength: number,
  addColors: boolean
): string {
  const indent = '  ';
  const padding = '    ';
  const errorLinePadded = String(error.line).padEnd(maxLineLength);
  const errorLineStylized = addColors ? style.gray(errorLinePadded) : errorLinePadded;
  const errorRuleStylized = addColors ? style.gray(error.rule) : error.rule;
  return (
    indent +
    errorLineStylized +
    padding +
    error.message.padEnd(maxMessageLength) +
    padding +
    errorRuleStylized
  );
}

function getMaxLineLength(result: LintResult): number {
  let length = 0;
  for (const error of result.errors) {
    const errorStr = String(error.line);
    if (errorStr.length > length) {
      length = errorStr.length;
    }
  }
  return length;
}

function getMaxMessageLength(
  result: LintResult,
  maxLineLength: number,
  consoleWidth: number
): number {
  let length = 0;
  for (const error of result.errors) {
    const errorStr = error.message;
    const expandedErrorStrLength = stylizeError(error, maxLineLength, 0, false).length;
    if (errorStr.length > length && expandedErrorStrLength < consoleWidth) {
      length = errorStr.length;
    }
  }
  return length;
}

export function printResults(results: LintResult[]): void {
  let consoleWidth = Infinity;
  if (process.stdout.isTTY) {
    consoleWidth = process.stdout.columns;
  }

  for (const result of results) {
    if (result.errors.length > 0) {
      const maxLineLength = getMaxLineLength(result);
      const maxMessageLength = getMaxMessageLength(result, maxLineLength, consoleWidth);
      console.error(stylizeFilePath(result.filePath));
      for (const error of result.errors) {
        console.error(stylizeError(error, maxLineLength, maxMessageLength, true));
      }
      console.error('\n');
    }
  }
}
