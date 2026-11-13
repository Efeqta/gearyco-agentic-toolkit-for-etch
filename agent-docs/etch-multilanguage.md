# Multilanguage sites in Etch Studio

**Use this only when the user says a site is or will be multilingual.** It is
not a default: a single-language site gets none of this — no i18n field set, no
per-language routes, no hreflang. Everything here was verified on a live deploy
(`projects/test`, https://efeqta-test.efeqta.workers.dev): 10 URLs across three
languages, one of which has only a home page.

Helpers: `shared-helpers/etch/i18n.js`. Copy-ready starter:
`shared-helpers/templates/multilang/`.

## What Etch Studio gives you

| Need | Mechanism |
| --- | --- |
| `<html lang="de">` | the route's `language` SEO field, which inherits down the route tree |
| `hreflang`, `x-default`, `canonical` | an `etch/head` block, which accepts loops and conditions |
| absolute URLs (hreflang needs them) | `{site.url}` — the deployed origin, no trailing slash |
| one template for every language | the record's own `language` field, used as a data-source argument |

There is **no** `route.language`, `this.language`, `page.language` or
`site.language` expression, and `site.locale` is the project default rather than
the current page's. The current language has to come from a field on the record.

## The model

One content type per kind of page; one template for all languages. Each
translatable type carries five fields (`ensureI18nFields`):

| Field | Type | Holds |
| --- | --- | --- |
| `language` | select | which language this record is in |
| `slug` | text | its URL segment; `''` for a language's home or a listing page |
| `path` | text | its full URL path, authored by hand (`/en/about-us/`) |
| `translations` | relationshipList | its counterparts in other languages |
| `xDefault` | boolean | this record is its group's hreflang x-default |

A language variant is **its own record**, with its own title, blocks and URL.
That is what buys the freedom: a language can have a different page set, a
different nav, or nothing but a home page, and no template branches on it.

`path` is deliberately manual — it is what hreflang and nav link to, and the one
thing that can drift from the routes. `i18nAudit()` is what makes that safe.

### Why not one route over the whole content type

A dynamic route whose source is `postTypes: ['page']` serves **every** item of
the type, so both language branches would publish every page. Each language
branch instead points at a `js` data source that filters by the language field.
Confirmed: `etch/render` with target `this.content` renders correctly on a route
backed by a data source, not just on a `postIds`/`postTypes` route.

## Build order

Copy `shared-helpers/templates/multilang/*` into `projects/<project>/etch/`,
edit `helpers.js`, then:

```bash
node shared-helpers/run.mjs <project> 01-model.js
```

```bash
node shared-helpers/run.mjs <project> 02-sources.js
```

```bash
node shared-helpers/run.mjs <project> 03-components.js
```

```bash
node shared-helpers/run.mjs <project> 04-template.js
```

```bash
node shared-helpers/run.mjs <project> 05-routes.js
```

```bash
node shared-helpers/run.mjs <project> 06-styles.js
```

Then audit before every deploy:

```bash
node shared-helpers/run.mjs <project> 99-verify.js
```

Every script is re-runnable (find-or-create, then update). `helpers.js` is the
only file that should need editing to re-point the set at another site.

## Adding things

**A language.** Add it to `LANGUAGES` and `PLAN` in `helpers.js`, add its items
in `01-model.js`, re-run `01`, `02`, `05`. The template is untouched. A
home-only language gets a `PLAN` entry with just `home`.

**A content type.** Create it in `01-model.js`, add its key to `TYPES`, give it
the same five fields via `ensureI18nFields`. `02-sources.js` then generates one
filtered route source per language automatically, and `05-routes.js` nests its
branch per language. The same template serves it, because it reads the same
field names.

**A page with no translation.** Leave `translations` empty. It emits only its own
self-reference — never invent a translation that does not exist.

## hreflang rules worth getting right

- **The x-default link belongs on every page of a group**, not only on the
  default page, and on all of them it points at the same URL — the group's
  default. `hreflangHead()` does this with two mutually exclusive conditions:
  `this.fields.xDefault` ("this page is the default") and `t.fields.xDefault`
  inside the translations loop ("a sibling is").
- A page must list **its whole set**: itself, every translation, and x-default.
- **It must be reciprocal.** If A lists B, B must list A, or Google ignores the
  set. `linkTranslations([a, b, c])` writes both directions; the audit checks it.
- Use **absolute** URLs. Relative hreflang hrefs are not supported.
- Exactly **one** `xDefault` per group. Zero emits none; two emit two. Only the
  audit catches this.

## Expression gotchas

Braces wrap a **whole** expression and never nest. A nested brace is a parse
error that Etch reports only in the deploy log — the canvas looks fine and the
attribute or loop silently renders empty.

```html
{data('stringsFor', this.fields.language).rights}     <!-- ok -->
{data('stringsFor', {this.fields.language}).rights}   <!-- js_parse_error -->
```

A **condition** takes a bare expression with no braces at all:
`this.fields.language === 'de'` fires; `{this.fields.language} === 'de'` never does.

- **Route sources cannot take arguments** — hence one source key per
  (type, language). Template lookups can: `data('navFor', this.fields.language)`.
- **Dynamic bracket keys do not resolve.** `data('strings')[this.fields.language]`
  renders empty; only a literal key works (`data('strings').de`). Pass the
  language as an argument to a `js` source instead.
- Array indexing works (`data('navFor', 'de')[0].href`); `.length` does not.
- A `relationshipList` resolves to full records on the frontend
  (`this.fields.translations[0].fields.path`) and can be a loop target.
- `{this.*}` resolves **inside a component**, so the header can read the record
  being rendered rather than taking everything as props. That is why there is one
  header component and not one per language.
- A `select` field arrives as a plain string.

## Other traps

- A content type key must be **lowercase**: `nav_item`, never `navItem`.
- A select **content field**'s choices are `options: [{ label, value }]`.
  `selectOptionsString` (the component-prop key) is silently ignored, and the
  item write then fails with "must be one of its options".
- `etch.dataSources.get(key)` **throws** for a missing key; test with `list()`.
- `listSeoAsync()` can come back incomplete in the same script that just created
  the routes. `getPathsAsync()` is the authoritative URL list.
- Only `published` paths are built — `shadowed`, `conflict` and `invalid` are not.
  A listing page sharing a slug with a dynamic route is the usual cause; give it
  `slug: ''` so the language's filtered source excludes it.
- Cloudflare caches the deployed site. Verify with a cache-busting query.
- Etch Studio has no preview API: deploy is the only way to see real rendered
  HTML, so `<html lang>` and head tags cannot be checked any other way.
