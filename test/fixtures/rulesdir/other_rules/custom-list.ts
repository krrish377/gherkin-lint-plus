const name = 'another-custom-list';

const availableConfigs = {
  element: [] as unknown[],
};

export default {
  name,
  run(
    _feature: unknown,
    _file: { relativePath: string; lines: string[] },
    _config: unknown
  ) {
    return [{ message: 'Another custom-list error', rule: name, line: 109 }];
  },
  availableConfigs,
};
