import { readFileSync, realpathSync } from 'node:fs';
import { generateMessages } from '@cucumber/gherkin';
import {
  IdGenerator,
  SourceMediaType,
  type Feature,
  type ParseError,
} from '@cucumber/messages';
import type { FileLines, LintError, LintResult, ParsedFeature, LinterConfiguration } from './types.js';
import * as logger from './logger.js';
import { runAllEnabledRules } from './rules/runner.js';
import { resetDuplicateFeatureState, resetDuplicateScenarioState } from './rules/duplicate-state.js';

/** Parser may list #ScenarioLine (older) or #RuleLine (Gherkin 9+) after tags at feature/rule level. */
function isTagLineContextExpectedAfterBackground(msg: string): boolean {
  return (
    msg.includes('expected: #TagLine, #ScenarioLine, #Comment, #Empty') ||
    msg.includes('expected: #TagLine, #RuleLine, #Comment, #Empty')
  );
}

function getFormattedFatalError(parseError: ParseError): LintError {
  const line = parseError.source.location?.line ?? 1;
  const data = parseError.message;

  if (data.includes("got 'Background")) {
    if (isTagLineContextExpectedAfterBackground(data)) {
      return {
        message: 'Tags on Backgrounds are dissallowed',
        rule: 'no-tags-on-backgrounds',
        line,
      };
    }
    return {
      message:
        'Another "Background" is not allowed here: at most one at feature level, and at most one inside each Rule (each Rule may still have its own Background).',
      rule: 'up-to-one-background-per-file',
      line,
    };
  }

  if (data.includes("got 'Feature")) {
    return {
      message: 'Multiple "Feature" definitions in the same file are disallowed',
      rule: 'one-feature-per-file',
      line,
    };
  }

  if (
    data.includes(
      'expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got'
    ) ||
    data.includes(
      'expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ExamplesLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got'
    )
  ) {
    return {
      message:
        'Steps should begin with "Given", "When", "Then", "And" or "But". Multiline steps are dissallowed',
      rule: 'no-multiline-steps',
      line,
    };
  }

  return {
    message: data,
    rule: 'unexpected-error',
    line,
  };
}

function processTaggedBackgroundErrors(
  errors: ParseError[]
): { rest: ParseError[]; messages: LintError[] } {
  const messages: LintError[] = [];
  let index = 0;
  const first = errors[0]?.message ?? '';
  const second = errors[1]?.message ?? '';

  if (first.includes("got 'Background") && isTagLineContextExpectedAfterBackground(second)) {
    const line = errors[0]?.source.location?.line ?? 1;
    messages.push({
      message: 'Tags on Backgrounds are dissallowed',
      rule: 'no-tags-on-backgrounds',
      line,
    });

    index = 2;
    for (let i = 2; i < errors.length; i++) {
      if (isTagLineContextExpectedAfterBackground(errors[i]?.message ?? '')) {
        index = i + 1;
      } else {
        break;
      }
    }
  }

  return { rest: errors.slice(index), messages };
}

/** Maps Cucumber `ParseError[]` to `LintError[]` (exported for tests and tooling). */
export function processFatalErrors(errors: ParseError[]): LintError[] {
  let working = errors;
  const out: LintError[] = [];

  if (working.length > 1) {
    const { rest, messages } = processTaggedBackgroundErrors(working);
    working = rest;
    out.push(...messages);
  }

  for (const err of working) {
    out.push(getFormattedFatalError(err));
  }

  return out;
}

export function readAndParseFile(filePath: string): Promise<ParsedFeature> {
  return new Promise((resolve, reject) => {
    try {
      const data = readFileSync(filePath, 'utf8');
      const envelopes = generateMessages(
        data,
        filePath,
        SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN,
        {
          includeGherkinDocument: true,
          includePickles: false,
          includeSource: true,
          newId: IdGenerator.incrementing(),
        }
      );

      let feature: Feature | undefined;
      let lines: string[] = [];
      const parseErrors: ParseError[] = [];

      for (const env of envelopes) {
        if (env.parseError) {
          parseErrors.push(env.parseError);
        }
        if (env.gherkinDocument?.feature) {
          feature = env.gherkinDocument.feature;
        }
        if (env.source?.data !== undefined) {
          lines = env.source.data.split(/\r\n|\r|\n/);
        }
      }

      if (parseErrors.length > 0) {
        reject(processFatalErrors(parseErrors));
        return;
      }

      const file: FileLines = {
        relativePath: filePath,
        lines,
      };
      resolve({ feature, file });
    } catch (err: unknown) {
      logger.error(`Failed to read or parse ${filePath}: ${String(err)}`);
      reject([
        {
          message: String(err),
          rule: 'unexpected-error',
          line: 1,
        } satisfies LintError,
      ]);
    }
  });
}

export async function lint(
  files: string[],
  configuration: LinterConfiguration,
  additionalRulesDirs: string[]
): Promise<LintResult[]> {
  resetDuplicateFeatureState();
  resetDuplicateScenarioState();
  const results: LintResult[] = [];

  for (const f of files) {
    let perFileErrors: LintError[] = [];
    try {
      const { feature, file } = await readAndParseFile(f);
      perFileErrors = runAllEnabledRules(feature, file, configuration, additionalRulesDirs);
    } catch (parsingErrors: unknown) {
      if (Array.isArray(parsingErrors)) {
        perFileErrors = parsingErrors as LintError[];
      }
    }
    results.push({
      filePath: realpathSync(f),
      errors: [...perFileErrors].sort((a, b) => a.line - b.line),
    });
  }

  return results;
}
