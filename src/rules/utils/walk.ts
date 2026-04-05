import type { Examples, Feature, Rule, Scenario, Tag } from '@cucumber/messages';

/** Every AST node that may carry tags (Background does not have tags in the Cucumber messages model). */
export type TagHost = Feature | Rule | Scenario | Examples;

/**
 * Visits Feature → optional Rules → Scenarios (at feature level or under a Rule).
 */
export function forEachScenario(
  feature: Feature,
  fn: (scenario: Scenario, ctx: { rule: Rule | undefined }) => void
): void {
  for (const fc of feature.children) {
    if (fc.rule) {
      const rule = fc.rule;
      for (const rc of rule.children) {
        if (rc.scenario) {
          fn(rc.scenario, { rule });
        }
      }
    } else if (fc.scenario) {
      fn(fc.scenario, { rule: undefined });
    }
  }
}

/**
 * Visits every tag-bearing node: Feature, each Rule, each Scenario, each Examples table.
 */
export function forEachTagHost(feature: Feature, fn: (node: TagHost) => void): void {
  fn(feature);
  for (const fc of feature.children) {
    if (fc.rule) {
      fn(fc.rule);
      for (const rc of fc.rule.children) {
        if (rc.scenario) {
          fn(rc.scenario);
          for (const ex of rc.scenario.examples) {
            fn(ex);
          }
        }
      }
    } else if (fc.scenario) {
      fn(fc.scenario);
      for (const ex of fc.scenario.examples) {
        fn(ex);
      }
    }
  }
}

/** Tags on a node, for rules that only need keyword + tags. */
export function tagHostKeywordTags(node: TagHost): { keyword: string; tags: readonly Tag[] } {
  return { keyword: node.keyword, tags: node.tags };
}
