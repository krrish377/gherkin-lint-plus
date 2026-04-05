import { afterEach, describe, expect, it } from 'vitest';
import {
  duplicateFeatureNames,
  duplicateScenarioNames,
  resetDuplicateFeatureState,
  resetDuplicateScenarioState,
} from '../src/rules/duplicate-state.js';

describe('duplicate-state', () => {
  afterEach(() => {
    resetDuplicateFeatureState();
    resetDuplicateScenarioState();
  });

  it('resetDuplicateFeatureState clears all tracked feature names', () => {
    duplicateFeatureNames['TmpFeature'] = { files: ['a.feature'] };
    resetDuplicateFeatureState();
    expect(Object.hasOwn(duplicateFeatureNames, 'TmpFeature')).toBe(false);
  });

  it('resetDuplicateScenarioState clears all tracked scenario names', () => {
    duplicateScenarioNames['TmpScenario'] = {
      locations: [{ file: 'b.feature', line: 2 }],
    };
    resetDuplicateScenarioState();
    expect(Object.hasOwn(duplicateScenarioNames, 'TmpScenario')).toBe(false);
  });

  it('reset helpers are safe when maps are already empty', () => {
    resetDuplicateFeatureState();
    resetDuplicateScenarioState();
    expect(Object.keys(duplicateFeatureNames)).toEqual([]);
    expect(Object.keys(duplicateScenarioNames)).toEqual([]);
  });
});
