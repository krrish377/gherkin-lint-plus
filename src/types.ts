import type { Feature } from '@cucumber/messages';

export interface LintError {
  message: string;
  rule: string;
  line: number;
}

export interface FileLines {
  relativePath: string;
  lines: string[];
}

export interface LintResult {
  filePath: string;
  errors: LintError[];
}

export interface ParsedFeature {
  feature: Feature | undefined;
  file: FileLines;
}

export type RuleConfigValue =
  | 'on'
  | 'off'
  | ['on' | 'off']
  | ['on' | 'off', Record<string, unknown> | string];

export type LinterConfiguration = Record<string, RuleConfigValue>;
