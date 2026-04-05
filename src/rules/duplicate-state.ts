/** Cross-file state for `no-dupe-feature-names` (reset once per `lint()` run). */
export const duplicateFeatureNames: Record<string, { files: string[] }> = Object.create(null);

/** Cross-file state for `no-dupe-scenario-names` when scope is `anywhere`. */
export const duplicateScenarioNames: Record<
  string,
  { locations: { file: string; line: number }[] }
> = Object.create(null);

export function resetDuplicateFeatureState(): void {
  for (const k of Object.keys(duplicateFeatureNames)) {
    delete duplicateFeatureNames[k];
  }
}

export function resetDuplicateScenarioState(): void {
  for (const k of Object.keys(duplicateScenarioNames)) {
    delete duplicateScenarioNames[k];
  }
}
