import { dialects, type Dialect } from '@cucumber/gherkin';

const DIALECT_ARRAY_KEYS: (keyof Dialect)[] = [
  'and',
  'background',
  'but',
  'examples',
  'feature',
  'given',
  'rule',
  'scenario',
  'scenarioOutline',
  'then',
  'when',
];

export function getLanguageInsensitiveKeyword(
  node: { keyword: string },
  language: string
): string | undefined {
  const lang = dialects[language];
  if (!lang) {
    return undefined;
  }
  for (const key of DIALECT_ARRAY_KEYS) {
    const values = lang[key];
    if (Array.isArray(values) && values.includes(node.keyword)) {
      return key;
    }
  }
  return undefined;
}

export function getNodeType(node: { keyword: string }, language: string): string {
  const key = getLanguageInsensitiveKeyword(node, language)?.toLowerCase() ?? '';
  const stepKeys = ['given', 'when', 'then', 'and', 'but'];

  if (key === 'feature') {
    return 'Feature';
  }
  if (key === 'rule') {
    return 'Rule';
  }
  if (key === 'background') {
    return 'Background';
  }
  if (key === 'scenario') {
    return 'Scenario';
  }
  if (key === 'scenariooutline') {
    return 'Scenario Outline';
  }
  if (key === 'examples') {
    return 'Examples';
  }
  if (stepKeys.includes(key)) {
    return 'Step';
  }
  return '';
}
