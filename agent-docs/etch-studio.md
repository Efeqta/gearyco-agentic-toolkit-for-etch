# Etch Studio conventions

Project conventions for content types, templates and assets on Etch Studio sites.

## URL slugs

- Name any custom field that stores a URL path segment **Slug**.
- Use the field key `slug`.
- Reference it in dynamic routes as `{this.fields.slug}`.
- Do not use alternatives such as `url_segment`, `url`, or `permalink` for this purpose.
- Before creating the field, inspect the content type and reuse or rename an equivalent field instead of adding a duplicate.

Example:

```text
Field name: Slug
Field key: slug
Route segment: {this.fields.slug}
```

## Expression syntax (verified on a live deploy)

Braces wrap a **whole** expression. Never nest them. A nested brace is a hard
parse error (`js_parse_error: Unexpected keyword 'this'`) that Etch reports only
in the deploy log — the canvas looks fine and the attribute or loop silently
renders empty.

```html
<!-- ok: whole expression, braces outside -->
<a href="{data('langHome', this.fields.language)}">
{data('stringsFor', this.fields.language).rights}

<!-- broken: braces inside braces -->
{data('stringsFor', {this.fields.language}).rights}
```

A **condition** takes a bare expression with no braces at all:

```js
cond('DE only', "this.fields.language === 'de'", [...])   // fires
cond('DE only', "{this.fields.language} === 'de'", [...])  // never fires
```

Verified to work in frontend expressions:

- `{site.url}` — the deployed origin, no trailing slash. Use it to build the
  absolute URLs that `hreflang` requires. `site.name` works; `site.baseUrl`,
  `site.domain` and `site.language` do not.
- `site.locale` is the project default, **not** the current page's language.
  There is no `route.language`, `this.language` or `page.language`. Read the
  current language from a field on the record (`this.fields.language`).
- `{environment.current}` is `frontend` on a deployed page, `etch` in the canvas.
- Arguments: `data('key', this.fields.language)` passes the value into a `js`
  source as `args[0]`. A `select` field arrives as a plain string.
- Array indexing: `data('navFor', 'de')[0].href`. But `.length` resolves empty.
- **Dynamic bracket keys do not work.** `data('strings')[this.fields.language]`
  renders empty; only a literal key resolves (`data('strings').de`). For a
  per-language lookup, pass the language as an argument to a `js` source.
- A `relationshipList` resolves to full records on the frontend:
  `this.fields.translations[0].fields.path`, and it can be a loop target.
- `{this.*}` resolves **inside a component**, so a component can read the record
  being rendered instead of taking everything as props.

## Routes and SEO notes

- `listSeoAsync()` can come back incomplete when called in the same script that
  just created the routes — data-source-backed pages were missing from it once
  and present on the next run. Treat `getPathsAsync()` as the authoritative URL
  list, and re-read SEO in a separate call after a route pass.
- `searchVisibility: 'hidden'` on a route emits
  `<meta name="robots" content="noindex" />`. Like the other SEO fields it
  inherits from the nearest ancestor that sets it.
- A content type key must be lowercase (`nav_item`, not `navItem`). Creating a
  type also creates a `js` data source under the same key.

## Multilanguage

**Only when the user says a site is or will be multilingual.** Full rules, the
field set and the build order: `agent-docs/etch-multilanguage.md`. Never apply
any of it to a single-language site.

Confirmed working end to end (see `projects/test/`):

- **`<html lang>`** comes from the route's `language` SEO field, which inherits
  down the route tree. Set it once per language branch.
- **`etch/head`** accepts loops, conditions and `<link>` elements, so
  `hreflang`, `x-default` and `canonical` can all be authored per page.
- **`etch/render` with target `this.content` renders fine on a route whose
  source is a data source**, not just a `postIds`/`postTypes` route. This is
  what lets one content type back every language: a dynamic route over
  `postTypes` serves *every* item of the type, so each language branch instead
  points at a `js` source that filters by the language field.
- **`hreflang="x-default"` belongs on every page of a translation group**, not
  only on the default page, and on all of them it points at the same URL — the
  group's default. A page must list its whole set: itself, every translation,
  and the one x-default. With a per-page `xDefault` checkbox that means two
  mutually exclusive conditions: `this.fields.xDefault` for "this page is the
  default", and `t.fields.xDefault` inside the translations loop for "a sibling
  is". A condition on a boolean field works in both scopes.

## Select content fields

A `select` content field takes its choices in an `options` array of
`{ label, value }` objects. The component-prop key `selectOptionsString` is
silently ignored here, and an item write then fails with "Language must be one
of its options".

```js
await etch.content.addFieldAsync('page', { key: 'language', name: 'Language', type: 'select' });
await etch.content.updateFieldAsync('page', 'language', {
  options: [
    { label: 'Deutsch', value: 'de' },
    { label: 'English', value: 'en' },
  ],
});
```

`etch.dataSources.get(key)` throws `No data source with key "…"` for a missing
key rather than returning `undefined`; test with `etch.dataSources.list()`
before an upsert.

## Main template

- Name the primary site template `index`.
- The `index` template contains the shared header and footer and renders the current record’s content.
- Wrap the `@render` block in a `<main>` element, placed between the header and footer. Do not leave `@render` as a direct sibling of the header and footer.
- Reuse `index` for standard routes instead of creating equivalent templates with names such as `Default Page` or `Main`.

## Asset collections

- Every uploaded asset must belong to a collection. Never leave an asset uncollected.
- Before uploading, list the existing collections with `etch.assets.listCollectionsAsync()` and reuse a matching one. Only create a collection when none fits.
- Group by what the asset is, using plural names: `Fonts`, `Graphics` (decorative SVGs, patterns, textures), `Icons`, `Logos`, `Photos`, `Documents`.
- Assign the collection in the same step as the upload: pass `--collection <id>` to `etch-connector upload`, or call `etch.assets.updateAsync(id, { collectionIds: [collectionId] })` straight after `uploadAsync`.
- `etch.assets.createCollectionAsync(name)` takes the name as a plain string.
- After uploading, confirm with `etch.assets.listAsync()` that no asset has an empty `collectionIds`.
