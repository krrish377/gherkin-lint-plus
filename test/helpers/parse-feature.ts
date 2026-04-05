import { generateMessages } from '@cucumber/gherkin';
import { IdGenerator, SourceMediaType, type Feature } from '@cucumber/messages';
import type { FileLines } from '../../src/types.js';

/**
 * Parse Gherkin text into AST + source lines (same shape as the linter).
 * Throws if the parser reports errors.
 */
export function parseFeatureSource(uri: string, data: string): {
  feature: Feature | undefined;
  file: FileLines;
} {
  const envelopes = generateMessages(data, uri, SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN, {
    includeGherkinDocument: true,
    includePickles: false,
    includeSource: true,
    newId: IdGenerator.incrementing(),
  });

  let feature: Feature | undefined;
  let lines: string[] = [];

  for (const env of envelopes) {
    if (env.parseError) {
      throw new Error(`${uri}: ${env.parseError.message}`);
    }
    if (env.gherkinDocument?.feature) {
      feature = env.gherkinDocument.feature;
    }
    if (env.source?.data !== undefined) {
      lines = env.source.data.split(/\r\n|\r|\n/);
    }
  }

  return {
    feature,
    file: { relativePath: uri, lines },
  };
}
