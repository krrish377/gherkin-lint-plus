import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createJiti } from 'jiti';
import { globSync } from 'glob';
import type { RuleDefinition } from './rule.js';

const jiti = createJiti(import.meta.url, { interopDefault: true });

function unwrapLoadedModule(mod: unknown): unknown {
  if (mod !== null && typeof mod === 'object' && 'default' in mod) {
    const d = (mod as { default: unknown }).default;
    if (d !== undefined && d !== null) {
      return d;
    }
  }
  return mod;
}

function normalizeRuleExport(mod: unknown, filePath: string): RuleDefinition {
  const root = unwrapLoadedModule(mod);
  if (root === null || root === undefined || typeof root !== 'object') {
    throw new Error(`Rule module ${filePath} must default-export an object (or export { name, run, … })`);
  }
  const o = root as Record<string, unknown>;
  const name = o.name;
  const run = o.run;
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`Rule module ${filePath} must export a non-empty string "name"`);
  }
  if (typeof run !== 'function') {
    throw new Error(`Rule module ${filePath} must export a function "run"`);
  }

  let availableConfigs: RuleDefinition['availableConfigs'];
  if (o.availableConfigs === undefined) {
    availableConfigs = [];
  } else if (Array.isArray(o.availableConfigs)) {
    availableConfigs = o.availableConfigs as string[];
  } else if (typeof o.availableConfigs === 'object' && o.availableConfigs !== null) {
    availableConfigs = o.availableConfigs as Record<string, unknown>;
  } else {
    throw new Error(`Rule module ${filePath}: "availableConfigs" must be an array or object`);
  }

  return {
    name,
    run: run as RuleDefinition['run'],
    availableConfigs,
  };
}

/**
 * Load each `*.ts` file in the directory (non-recursive). TypeScript is compiled at load time via jiti.
 * Each file must default-export `{ name, run, availableConfigs? }`.
 */
export function loadCustomRulesFromDirectories(additionalRulesDirs: string[]): RuleDefinition[] {
  if (additionalRulesDirs.length === 0) {
    return [];
  }

  const byName = new Map<string, RuleDefinition>();

  for (const dir of additionalRulesDirs) {
    const resolved = path.isAbsolute(dir) ? path.normalize(dir) : path.resolve(process.cwd(), dir);

    if (!existsSync(resolved)) {
      throw new Error(`Rules directory does not exist: ${resolved}`);
    }
    if (!statSync(resolved).isDirectory()) {
      throw new Error(`Rules path is not a directory: ${resolved}`);
    }

    const files = globSync('*.ts', { cwd: resolved, nodir: true, absolute: true }).sort();

    for (const filePath of files) {
      let mod: unknown;
      try {
        mod = jiti(filePath);
      } catch (e) {
        throw new Error(`Failed to load rule module ${filePath}: ${String(e)}`);
      }
      const rule = normalizeRuleExport(mod, filePath);
      byName.set(rule.name, rule);
    }
  }

  return [...byName.values()];
}
