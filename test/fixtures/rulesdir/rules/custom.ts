const name = 'custom';

export default {
  name,
  run(
    _feature: unknown,
    _file: { relativePath: string; lines: string[] },
    _config: unknown
  ) {
    return [{ message: 'Custom error', rule: name, line: 123 }];
  },
  availableConfigs: [] as const,
};
