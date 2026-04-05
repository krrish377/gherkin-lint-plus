import type { Feature } from '@cucumber/messages';
import type { FileLines, LintError } from '../types.js';

/** Second part of `["on", ...]` or plain `{}` when rule is only `"on"` */
export type RuleRunConfig = string | Record<string, unknown>;

export type RuleRun = (
  feature: Feature | undefined,
  file: FileLines,
  config: RuleRunConfig
) => LintError[] | undefined;

export interface RuleDefinition {
  name: string;
  run: RuleRun;
  /** Keys allowed in the second element of `["on", { ... }]` config */
  availableConfigs: string[] | Record<string, unknown>;
}

export function asObjectConfig(config: RuleRunConfig): Record<string, unknown> {
  return typeof config === 'object' && config !== null && !Array.isArray(config) ? config : {};
}
