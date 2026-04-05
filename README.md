# gherkin-lint-new

A **Gherkin** linter for `.feature` files, implemented in **TypeScript** and built on [@cucumber/gherkin](https://www.npmjs.com/package/@cucumber/gherkin). It aims to be a modern, maintainable take on the same idea as the original [gherkin-lint](https://www.npmjs.com/package/gherkin-lint) CLI.

**Requirements:** Node.js `>=20 <23`.

## Install

```bash
npm install gherkin-lint-new
```

**From a git checkout (development):**

```bash
cd gherkin-lint-new
npm install
npm run build
```

`npm run build` runs the unit tests first, then compiles to `dist/`.

## Usage

You need a config file in the **current working directory** unless you pass `-c` (see below).

```bash
npx gherkin-lint-new [options] [files...]
```

- **No arguments:** lints all `**/*.feature` under `.`, respecting ignore rules.
- **Paths:** files, directories, or globs; directories are expanded to `**/*.feature` under them.

### CLI options

| Option | Description |
|--------|-------------|
| `-c, --config [path]` | Config file (default: `.gherkin-lintrc` in cwd) |
| `-f, --format [format]` | Output format; only **`stylish`** is supported today |
| `-i, --ignore <items>` | Comma-separated ignore globs (overrides `.gherkin-lintignore` if present) |
| `-r, --rulesdir <dir>` | Extra directory of custom rules (repeatable); see [Custom rules](#custom-rules) |

Exit code **1** if any file has lint errors.

## Configuration file

The default name is **`.gherkin-lintrc`** in your working directory. Contents are JSON with optional comments (JSONC). Use `-c` / `--config` if the file lives elsewhere.

Each key is a **rule name**. Allowed values:

| Form | Meaning |
|------|---------|
| `"on"` | Rule enabled with default options (or no extra options). |
| `"off"` | Rule disabled (**not allowed** for [mandatory](#built-in-rules-summary) rules). |
| `["on", <options>]` | Rule enabled; `<options>` is an object for most rules, or a string where documented (e.g. `new-line-at-eof`, `no-dupe-scenario-names`). |
| `["off", <options>]` | Rule disabled (same restriction for mandatory rules). |

**Optional rules** are **off** if omitted from the config.

**Mandatory rules** always run. You may omit them or set `"on"` / `["on", …]`; you must **not** set them to `"off"` or `["off", …]` (the CLI reports a configuration error).

### Example `.gherkin-lintrc`

```json
{
  "indentation": "on",
  "no-trailing-spaces": "on",
  "file-name": ["on", { "style": "kebab-case" }],
  "new-line-at-eof": ["on", "yes"]
}
```

## Ignoring feature files

1. Add **`.gherkin-lintignore`** in the working directory: one glob pattern per line.
2. Or use **`-i` / `--ignore`** with comma-separated globs (this **overrides** the ignore file when provided).

If there is no ignore file and you did not pass `-i`, **`node_modules/**`** is ignored by default.

## Built-in rules summary

| Rule name | Category | In `.gherkin-lintrc`? | Enable example |
|-----------|----------|------------------------|----------------|
| `no-tags-on-backgrounds` | **Parse** | No — fix the `.feature` file | — |
| `one-feature-per-file` | **Parse** | No | — |
| `up-to-one-background-per-file` | **Parse** | No | — |
| `no-multiline-steps` | **Parse** | No | — |
| `unexpected-error` | **Parse** | No (other parse failures) | — |
| `no-empty-file` | **Mandatory** | Yes (cannot turn off) | Omit, or `"no-empty-file": "on"` |
| `no-files-without-scenarios` | **Mandatory** | Yes (cannot turn off) | Omit, or `"on"` |
| `no-unnamed-features` | **Mandatory** | Yes (cannot turn off) | Omit, or `"on"` |
| `no-unnamed-scenarios` | **Mandatory** | Yes (cannot turn off) | Omit, or `"on"` |
| `allowed-tags` | Optional | Yes | `"allowed-tags": "on"` + options (see below) |
| `file-name` | Optional | Yes | `"file-name": ["on", { "style": "PascalCase" }]` |
| `indentation` | Optional | Yes | `"indentation": "on"` or `["on", { … }]` |
| `keywords-in-logical-order` | Optional | Yes | `"keywords-in-logical-order": "on"` |
| `max-scenarios-per-file` | Optional | Yes | `"max-scenarios-per-file": ["on", { … }]` |
| `name-length` | Optional | Yes | `"name-length": ["on", { … }]` |
| `new-line-at-eof` | Optional | Yes | `"new-line-at-eof": ["on", "yes"]` |
| `no-background-only-scenario` | Optional | Yes | `"no-background-only-scenario": "on"` |
| `no-dupe-feature-names` | Optional | Yes | `"no-dupe-feature-names": "on"` |
| `no-dupe-scenario-names` | Optional | Yes | `"on"` or `["on", "in-feature"]` |
| `no-duplicate-tags` | Optional | Yes | `"no-duplicate-tags": "on"` |
| `no-empty-background` | Optional | Yes | `"no-empty-background": "on"` |
| `no-examples-in-scenarios` | Optional | Yes | `"no-examples-in-scenarios": "on"` |
| `no-homogenous-tags` | Optional | Yes | `"no-homogenous-tags": "on"` |
| `no-multiple-empty-lines` | Optional | Yes | `"no-multiple-empty-lines": "on"` |
| `no-partially-commented-tag-lines` | Optional | Yes | `"no-partially-commented-tag-lines": "on"` |
| `no-restricted-patterns` | Optional | Yes | `["on", { … }]` |
| `no-restricted-tags` | Optional | Yes | `["on", { "tags": [], "patterns": [] }]` |
| `no-scenario-outlines-without-examples` | Optional | Yes | `"no-scenario-outlines-without-examples": "on"` |
| `no-superfluous-tags` | Optional | Yes | `"no-superfluous-tags": "on"` |
| `no-trailing-spaces` | Optional | Yes | `"no-trailing-spaces": "on"` |
| `no-unused-variables` | Optional | Yes | `"no-unused-variables": "on"` |
| `one-space-between-tags` | Optional | Yes | `"one-space-between-tags": "on"` |
| `only-one-when` | Optional | Yes | `"only-one-when": "on"` |
| `required-tags` | Optional | Yes | `["on", { … }]` |
| `scenario-size` | Optional | Yes | `["on", { "steps-length": { … } }]` |
| `use-and` | Optional | Yes | `"use-and": "on"` |

**Parse** rules are emitted when the Gherkin parser rejects the file. They are not toggled in config; correct the source. **Mandatory** rules always run and cannot be disabled.

**Backgrounds:** you may have **one** optional `Background` under `Feature`, and **one** optional `Background` inside **each** `Rule:`. `up-to-one-background-per-file` fires when a second `Background` appears in the same scope (duplicate at feature level or duplicate inside one rule).

---

## Rule reference

### Parse-time rules (not configurable)

These appear as `rule` IDs on parse failures. Fix the `.feature` text; do not add them to `.gherkin-lintrc`.

| Rule | What it checks |
|------|----------------|
| `no-tags-on-backgrounds` | Tags are not allowed on `Background`. |
| `one-feature-per-file` | Only one `Feature:` per file. |
| `up-to-one-background-per-file` | At most one `Background` in each feature or rule block. |
| `no-multiline-steps` | Step text must not continue as a random continuation line (use `And`, Doc Strings, or tables). |
| `unexpected-error` | Other parser errors, surfaced with the raw message. |

---

### Mandatory rules

Always evaluated. Use `"on"` or omit the key; never `"off"`.

#### `no-empty-file`

**What:** Whitespace-only or missing feature content is not allowed.

**Example:**

```json
{
  "no-empty-file": "on"
}
```

#### `no-files-without-scenarios`

**What:** The file must contain at least one scenario (including under `Rule:`).

**Example:**

```json
{
  "no-files-without-scenarios": "on"
}
```

#### `no-unnamed-features`

**What:** `Feature:` must have a name.

**Example:**

```json
{
  "no-unnamed-features": "on"
}
```

#### `no-unnamed-scenarios`

**What:** `Scenario:` / `Scenario Outline:` must have a name.

**Example:**

```json
{
  "no-unnamed-scenarios": "on"
}
```

---

### Optional rules

Turn on with `"rule-name": "on"` or `"off"` to disable. Use `["on", …]` when the rule needs options (below).

#### `allowed-tags`

**What:** Only listed tags and patterns are allowed on tag-bearing nodes.

**Enable / off:**

```json
{
  "allowed-tags": [
    "on",
    { "tags": ["@watch", "@wip"], "patterns": ["^@todo$"] }
  ]
}
```

```json
{ "allowed-tags": "off" }
```

#### `file-name`

**What:** Basename of `*.feature` must match a naming style (default `PascalCase`).

**Styles:** `PascalCase`, `Title Case`, `camelCase`, `kebab-case`, `snake_case`

```json
{
  "file-name": ["on", { "style": "kebab-case" }]
}
```

#### `indentation`

**What:** Checks column positions for keywords, tags, steps, and example tables. Defaults: feature-level keywords at 0; steps and table rows at 2 spaces. Override per keyword type; localized Gherkin keywords are supported.

```json
{
  "indentation": [
    "on",
    {
      "Feature": 0,
      "Background": 0,
      "Rule": 0,
      "Scenario": 0,
      "Step": 2,
      "Examples": 0,
      "example": 2,
      "given": 2,
      "when": 2,
      "then": 2,
      "and": 2,
      "but": 2,
      "feature tag": 0,
      "scenario tag": 0
    }
  ]
}
```

#### `keywords-in-logical-order`

**What:** `Given` / `When` / `Then` order should follow a sensible flow.

```json
{ "keywords-in-logical-order": "on" }
```

#### `max-scenarios-per-file`

**What:** Caps how many “scenarios” count per file (plain scenarios count as 1; outlines can count each example row).

**Options:** `maxScenarios` (default `10`), `countOutlineExamples` (default `true`)

```json
{
  "max-scenarios-per-file": [
    "on",
    { "maxScenarios": 10, "countOutlineExamples": true }
  ]
}
```

#### `name-length`

**What:** Max length for `Feature`, `Rule`, `Scenario`, and step text (default 70 each).

```json
{
  "name-length": [
    "on",
    { "Feature": 70, "Rule": 70, "Scenario": 70, "Step": 70 }
  ]
}
```

#### `new-line-at-eof`

**What:** Require or forbid a newline at end of file. **Must** use a string option: `"yes"` or `"no"`.

```json
{ "new-line-at-eof": ["on", "yes"] }
```

```json
{ "new-line-at-eof": ["on", "no"] }
```

#### `no-background-only-scenario`

**What:** If there is only one scenario, a `Background` is not allowed (feature level or inside a `Rule`).

```json
{ "no-background-only-scenario": "on" }
```

#### `no-dupe-feature-names`

**What:** The same feature name must not appear in more than one linted file (cross-file state).

```json
{ "no-dupe-feature-names": "on" }
```

#### `no-dupe-scenario-names`

**What:** Duplicate scenario names. **String option:** `"anywhere"` (default, cross-file) or `"in-feature"` (per feature only).

```json
{ "no-dupe-scenario-names": "on" }
```

```json
{ "no-dupe-scenario-names": ["on", "in-feature"] }
```

#### `no-duplicate-tags`

**What:** No duplicate tags on the same feature, rule, or scenario.

```json
{ "no-duplicate-tags": "on" }
```

#### `no-empty-background`

**What:** `Background` must contain at least one step.

```json
{ "no-empty-background": "on" }
```

#### `no-examples-in-scenarios`

**What:** `Examples` belongs on scenario outlines, not plain scenarios.

```json
{ "no-examples-in-scenarios": "on" }
```

#### `no-homogenous-tags`

**What:** If every scenario shares the same tag(s), prefer moving those tags to the feature (or avoid redundant tagging).

```json
{ "no-homogenous-tags": "on" }
```

#### `no-multiple-empty-lines`

**What:** No runs of multiple blank lines.

```json
{ "no-multiple-empty-lines": "on" }
```

#### `no-partially-commented-tag-lines`

**What:** Tag lines must not be partially commented in a misleading way.

```json
{ "no-partially-commented-tag-lines": "on" }
```

#### `no-restricted-patterns`

**What:** Ban regex patterns (case-insensitive) in names, descriptions, and step text. Keys: `Global`, `Feature`, `Rule`, `Background`, `Scenario`, `ScenarioOutline`. Match step **text** only (not the `Given`/`When` keyword).

```json
{
  "no-restricted-patterns": [
    "on",
    {
      "Global": ["^globally restricted"],
      "Feature": ["poor description"],
      "Background": [],
      "Scenario": [],
      "Rule": [],
      "ScenarioOutline": []
    }
  ]
}
```

#### `no-restricted-tags`

**What:** Disallow specific `@tags` and patterns.

```json
{
  "no-restricted-tags": [
    "on",
    { "tags": ["@watch"], "patterns": ["^@todo$"] }
  ]
}
```

#### `no-scenario-outlines-without-examples`

**What:** Every scenario outline must have `Examples`.

```json
{ "no-scenario-outlines-without-examples": "on" }
```

#### `no-superfluous-tags`

**What:** Tags repeated on both feature and scenarios inside that feature are flagged.

```json
{ "no-superfluous-tags": "on" }
```

#### `no-trailing-spaces`

**What:** No trailing spaces on lines.

```json
{ "no-trailing-spaces": "on" }
```

#### `no-unused-variables`

**What:** Scenario outline placeholders must match `Examples` headers (no unused columns, no missing columns).

```json
{ "no-unused-variables": "on" }
```

#### `one-space-between-tags`

**What:** Multiple tags on one line must be separated by a single space.

```json
{ "one-space-between-tags": "on" }
```

#### `only-one-when`

**What:** At most one `When` step per scenario.

```json
{ "only-one-when": "on" }
```

#### `required-tags`

**What:** Scenarios must match tag regexes. **Options:** `tags` (regex strings), `ignoreUntagged` (default `true` — untagged scenarios skipped).

```json
{
  "required-tags": [
    "on",
    { "tags": ["^@issue:[1-9]\\d*$"], "ignoreUntagged": false }
  ]
}
```

#### `scenario-size`

**What:** Max steps per `Background` (feature level), `Scenario` (feature-level scenarios/outlines), and everything under a `Rule` (uses the `Rule` limit).

```json
{
  "scenario-size": [
    "on",
    {
      "steps-length": {
        "Rule": 15,
        "Background": 15,
        "Scenario": 15
      }
    }
  ]
}
```

#### `use-and`

**What:** Repeated same step keyword (`Given`, `When`, …) should use `And` / `But` instead.

```json
{ "use-and": "on" }
```

---

## Custom rules

Use **`-r` / `--rulesdir`** one or more times. Each path must be a directory (absolute or relative to cwd). The linter loads every **`*.ts`** file in that directory (**not** subfolders). Files are compiled at runtime with [jiti](https://github.com/unjs/jiti); **JavaScript rule files are not supported.**

Each module must **default-export** a rule object:

```ts
import type { Feature } from '@cucumber/messages';

const name = 'my-rule';

export default {
  name,
  run(
    feature: Feature | undefined,
    file: { relativePath: string; lines: string[] },
    config: unknown
  ) {
    return [{ message: '…', rule: name, line: 1 }];
  },
  availableConfigs: [] as const,
};
```

- **`name`** — must match the key in `.gherkin-lintrc`.
- **`run`** — returns `{ message, rule, line }[]`, or `undefined` / `[]` if OK. `config` is the second part of `["on", …]` when present, else `{}`.
- **`availableConfigs`** — `[]` if only `"on"`/`"off"`; otherwise a string array (allowed string options) or an object whose keys are allowed option names.

If two files define the same **`name`**, the one loaded **last** wins.

Add **`@cucumber/messages`** (and optionally **`typescript`**) to your project for typing. See built-in rules under `src/rules/` and the [rulesdir fixture](test/fixtures/rulesdir/).

## Development

| Script | Purpose |
|--------|---------|
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Tests + coverage (HTML & LCOV under `coverage/`) |
| `npm run build` | Tests, then `tsc` |
| `npm start` | Run `node dist/main.js` (after build) |

## Limitations (current)

- **Output:** only the **stylish** formatter; `json` / `xunit` are not implemented.

## License

ISC
