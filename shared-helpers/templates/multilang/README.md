# Multilanguage starter

Copy-ready build scripts for a multilingual Etch Studio site. Use it only when
a site is actually meant to be multilingual. The rules, the
reasoning and the gotchas are in `agent-docs/etch-multilanguage.md`; the
helpers these call are in `shared-helpers/etch/i18n.js`.

```bash
cp shared-helpers/templates/multilang/*.js projects/<project>/etch/
```

Then edit `projects/<project>/etch/helpers.js` — `LANGUAGES`, `STRINGS`,
`TYPES`, `PLAN`, `TITLE` — and run `01` … `06` in order, then `99`.

| File | Does |
| --- | --- |
| `helpers.js` | the only per-site configuration |
| `01-model.js` | content types, i18n fields, items, translation links, nav |
| `02-sources.js` | one filtered route source per (type, language), plus template lookups |
| `03-components.js` | one `Site Header` for every language, plus footer |
| `04-template.js` | the single `index` template, plus page bodies |
| `05-routes.js` | the route tree and `<html lang>` |
| `06-styles.js` | minimum CSS so the starter is legible |
| `99-verify.js` | read-only audit; run before every deploy |

The starter ships two languages and one content type. Adding a third language,
or a second type, is described under "Adding things" in the doc — the template
is not touched either way.

A worked three-language reference, including a language that has only a home
page and a second content type with its own per-language branches, is
`projects/test/` (not in git; `projects/*` is private).
