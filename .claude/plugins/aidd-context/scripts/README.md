# aidd-context scripts

Maintenance tooling for the vendored AIDD plugins. These scripts came from the upstream
framework repository, where they lived at the repo root under `scripts/`. In this project they
are owned by `aidd-context`, whose domain is producing and maintaining context artifacts.

## Layout assumption

Upstream, every script resolved the directory holding `plugins/` as the parent of `scripts/`.
Here that directory is `.claude/`, three levels up:

```
.claude/                      <- AIDD root (holds plugins/)
└── plugins/
    ├── aidd-context/
    │   └── scripts/          <- you are here
    ├── aidd-dev/
    └── ...
```

Every path-resolving script honours `AIDD_ROOT` as an override. Point it at an upstream
framework checkout to run these against the real repo instead of the vendored copy.

## Module boundary

`package.json` here pins `"type": "commonjs"`. Without it Node walks up to the app's own
`package.json` (`"type": "module"`) and the `require()`-based scripts die on `ReferenceError:
require is not defined`. The `.mjs` scripts are unaffected — they stay ESM by extension.

## What runs against the vendored copy

Run from `.claude/`:

| Script | Purpose |
| - | - |
| `check-markdown-links.js` | Verify every markdown link and `@include` across the plugins resolves. |
| `check-skill-argument-hints.mjs` | Enforce R4 of the skill contract on `SKILL.md` frontmatter. |
| `validate-json.mjs` | JSON syntax + Claude metadata schema validation (`plugin.json`, `hooks.json`). |
| `validate-yaml.mjs` | YAML syntax check. |
| `summarize-markdown.js` | Regenerate the per-plugin `CATALOG.md` files. |
| `doctor.sh` | Diagnostic preflight on the marketplace + plugin install state. |
| `skill-eval.mjs` | Behavioural eval harness; runs skills for real through headless `claude -p`. |

`check-skill-argument-hints.mjs` and `validate-json.mjs` resolve from `process.cwd()`, so they
must be invoked from `.claude/`. The others self-resolve.

### Missing npm dependencies

`validate-json.mjs` needs `ajv` + `ajv-formats`, `validate-yaml.mjs` needs `js-yaml`. Upstream
they came from the framework repo's own `devDependencies`; this project does not carry them, and
adding framework tooling to the app's `package.json` would be the wrong trade. Run them ad hoc:

```sh
cd .claude && npx --yes -p ajv -p ajv-formats node plugins/aidd-context/scripts/validate-json.mjs <files>
```

`claude plugin validate <plugin-dir>` covers the same ground for manifests without any install.

### Known findings against the vendored copy

`check-markdown-links.js` reports 8 broken `../../README.md` links in the per-plugin READMEs.
They point at the framework repo's root README, which a vendored install does not carry. Expected
drift, not a regression from the move.

## Framework-repo only

These need the upstream git checkout (its `cli/`, its `README.md`, its GitHub remote) and will
no-op or fail against the vendored copy. They are kept for when `AIDD_ROOT` points at a real
clone:

- `dev-setup.sh`, `dev-sync.sh` — build and install the framework into Claude and Codex.
- `sync-readme-counts.mjs` — rewrites the framework README's plugin/skill counts.
- `generate-star-history.mjs` — renders the repo's stargazer chart.
