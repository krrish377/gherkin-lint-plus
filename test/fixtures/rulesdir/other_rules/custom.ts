const name = 'another-custom';

export default {
  name,
  run(
    _feature: unknown,
    _file: { relativePath: string; lines: string[] },
    _config: unknown
  ) {
    return [{ message: 'Another custom error', rule: name, line: 456 }];
  },
  availableConfigs: [] as const,
};
