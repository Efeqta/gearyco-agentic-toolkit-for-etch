// Multilanguage (i18n) helpers for Etch Studio.
//
// Model: ONE content type per kind of page, ONE template for every language.
// A record carries its own language and its own translation links, so each
// language is free to have a different page set, a different nav, or nothing
// but a home page.
//
// Fields added to every translatable type:
//   language      select  - which language this record is in
//   slug          text    - its URL segment ('' for a language's home page)
//   path          text    - its full URL path, authored by hand ('/en/about-us/')
//   translations  relList - its counterparts in other languages
//   xDefault      boolean - this record is its group's hreflang x-default
//
// `path` is deliberately manual: it is what hreflang and nav link to, and it is
// the one thing that can drift from the routes. i18nAudit() checks it.
//
// EXPRESSION RULE: braces wrap a WHOLE expression and never nest.
//   ok   {data('stringsFor', this.fields.language).rights}
//   bad  {data('stringsFor', {this.fields.language}).rights}   -> parse error
// A condition takes a bare expression with NO braces.

const ex = (expr) => `{${expr}}`;

const jsonSource = (name, data) => ({ name, type: 'json', metadata: { data } });

// <etch:head> and a void <link>, which blocks.js has no builder for.
const headBlock = (children, name = 'Head') =>
  ({ type: 'etch/head', version: 1, context: { name }, children });
const linkEl = (name, attributes) =>
  ({ type: 'etch/element', version: 1, context: { name }, tag: 'link', attributes, children: [] });

// ---------------------------------------------------------------- content model

const i18nFields = (targetType) => [
  { key: 'language', name: 'Language', type: 'select' },
  { key: 'slug', name: 'Slug', type: 'text' },
  { key: 'path', name: 'Path', type: 'text' },
  { key: 'translations', name: 'Translations', type: 'relationshipList', target: targetType },
  { key: 'xDefault', name: 'Is x-default', type: 'boolean' },
];

// A select field's choices are an `options` array of { label, value }.
// `selectOptionsString` (the component-prop key) is silently ignored here.
const langOptions = (languages) => languages.map((l) => ({ label: l.label || l.code, value: l.code }));

const ensureI18nFields = async (typeKey, languages) => {
  const type = await etch.content.getTypeAsync(typeKey);
  const have = new Set((type.fields || []).map((f) => f.key));
  for (const f of i18nFields(typeKey)) {
    if (!have.has(f.key)) await etch.content.addFieldAsync(typeKey, f);
  }
  await etch.content.updateFieldAsync(typeKey, 'language', { options: langOptions(languages) });
  return typeKey;
};

// Content type keys must be lowercase: 'nav_item', never 'navItem'.
const ensureNavType = async (languages, typeKey = 'nav_item') => {
  const types = (await etch.content.listTypesAsync()).map((t) => t.key);
  if (!types.includes(typeKey)) {
    await etch.content.createTypeAsync({
      name: 'Nav item',
      key: typeKey,
      fields: [
        { key: 'language', name: 'Language', type: 'select' },
        { key: 'label', name: 'Label', type: 'text' },
        { key: 'href', name: 'Href', type: 'text' },
        { key: 'order', name: 'Order', type: 'number' },
      ],
    });
  }
  await etch.content.updateFieldAsync(typeKey, 'language', { options: langOptions(languages) });
  return typeKey;
};

// Find-or-update an item by title. Re-runnable.
const ensureItem = async (postType, title, fields = {}) => {
  const found = (await etch.content.listItemsAsync(postType)).find((i) => i.title === title);
  if (found) { await etch.content.updateItemAsync(found.id, { fields }); return found.id; }
  return (await etch.content.createItemAsync({ postType, title, fields })).id;
};

// Link a translation group both ways. hreflang is ignored unless reciprocal.
const linkTranslations = async (ids) => {
  for (const id of ids) {
    await etch.content.updateItemAsync(id, { fields: { translations: ids.filter((o) => o !== id) } });
  }
  return ids;
};

// ---------------------------------------------------------------- data sources

const langKey = (base, code) => base + code.charAt(0).toUpperCase() + code.slice(1);

// A ROUTE source takes a bare key and cannot receive arguments, so every
// (type, language) pair needs its own source. Items with no slug are excluded:
// those are a language's home or a listing page, served by a static route.
const upsertLanguageSources = async (typeKeys, languages) => {
  const keys = [];
  for (const type of typeKeys) {
    for (const l of languages) {
      const key = langKey(type === 'page' ? 'pages' : type, l.code);
      await upsertDataSource(key, jsSource(`${type} ${l.code.toUpperCase()}`, [
        `const rows = await queryContent({ type: '${type}' });`,
        `return rows.filter(r => r.fields.language === '${l.code}' && r.fields.slug);`,
      ].join('\n')));
      keys.push(key);
    }
  }
  return keys;
};

// Everything a TEMPLATE needs, where the language arrives as an argument.
// Dynamic bracket keys do not resolve (data('strings')[this.fields.language]
// renders empty), so a per-language lookup must be an argument, not an index.
const upsertLanguageHelpers = async (languages, strings = {}, navType = 'nav_item') => {
  const prefixes = Object.fromEntries(languages.map((l) => [l.code, l.prefix]));
  const fallback = languages[0].code;

  await upsertDataSource('langHome', jsSource('Home path for language',
    `const p = ${JSON.stringify(prefixes)};\nreturn p[args[0]] || ${JSON.stringify(languages[0].prefix)};`));

  // `strings` stays a JSON source so it can be hand-edited in the Data Manager;
  // `stringsFor` is the arg-based reader the template actually uses.
  await upsertDataSource('strings', jsonSource('UI strings', strings));
  await upsertDataSource('stringsFor', jsSource('UI strings for language',
    `const s = ${JSON.stringify(strings)};\nreturn s[args[0]] || s[${JSON.stringify(fallback)}];`));

  // Nav read from its own content type, so each language's menu is independent.
  await upsertDataSource('navFor', jsSource('Nav for language', [
    `const rows = await queryContent({ type: '${navType}', omit: ['content'] });`,
    'return rows',
    '  .filter(r => r.fields.language === args[0])',
    '  .sort((a, b) => (a.fields.order || 0) - (b.fields.order || 0))',
    '  .map(r => ({ label: r.fields.label, href: r.fields.href }));',
  ].join('\n')));

  return ['langHome', 'strings', 'stringsFor', 'navFor'];
};

// A listing source for one type, filtered by a language argument.
const upsertListingSource = async (typeKey, key = `${typeKey}For`) => {
  await upsertDataSource(key, jsSource(`${typeKey} for language`, [
    `const rows = await queryContent({ type: '${typeKey}', omit: ['content'] });`,
    'return rows',
    '  .filter(r => r.fields.language === args[0])',
    '  .map(r => ({ title: r.title, path: r.fields.path }));',
  ].join('\n')));
  return key;
};

// ---------------------------------------------------------------- head

// The hreflang set for the record being rendered. Every page of a group carries
// the WHOLE set: itself, each translation, and exactly one x-default pointing
// at the group's default - which is why there are two x-default branches.
const hreflangHead = ({ canonical = true, extra = [] } = {}) => {
  const abs = (pathExpr) => `{site.url}${ex(pathExpr)}`;
  const xDefault = (pathExpr) =>
    linkEl('x-default', { rel: 'alternate', hreflang: 'x-default', href: abs(pathExpr) });
  return headBlock([
    linkEl('Self', { rel: 'alternate', hreflang: ex('this.fields.language'), href: abs('this.fields.path') }),
    loop('this.fields.translations', 't', [
      linkEl('Alternate', { rel: 'alternate', hreflang: ex('t.fields.language'), href: abs('t.fields.path') }),
      cond('x-default is this translation', 't.fields.xDefault', [xDefault('t.fields.path')]),
    ], 'Hreflang alternates'),
    cond('x-default is this page', 'this.fields.xDefault', [xDefault('this.fields.path')]),
    ...(canonical ? [linkEl('Canonical', { rel: 'canonical', href: abs('this.fields.path') })] : []),
    ...extra,
  ]);
};

// ---------------------------------------------------------------- routes

// `<html lang>` comes from a route's `language`, which inherits down the tree.
const seoDefaults = (code, { title }) => ({
  language: code,
  ...(title ? { title } : {}),
});

// The language's entry point: the site root for the language whose prefix is
// '/', a static segment ('en', 'fr') for the rest.
const upsertLanguageRoot = async (lang, { templateId, homeId, title }) => {
  const root = await rootRoute();
  const def = {
    templateId,
    ...seoDefaults(lang.code, { title }),
    source: { postIds: [homeId], postTypes: [], dataSources: [] },
  };
  if (lang.prefix === '/') { await etch.routes.updateAsync(root.id, def); return root.id; }
  const segment = lang.segment || lang.code;
  return upsertRoute(root.id, segment, segment, def);
};

// One URL per record of `sourceKey`, e.g. /ueber-uns/ or /en/news/first-post/.
const upsertDynamicBranch = async (parentId, lang, { templateId, sourceKey, title }) =>
  upsertRoute(parentId, (r) => r.kind === 'dynamic', '{this.fields.slug}', {
    ...dataSourceRoute([sourceKey], templateId),
    ...seoDefaults(lang.code, { title }),
  });

// A fixed segment serving one page, e.g. /news/ or /en/news/.
const upsertStaticBranch = async (parentId, segment, lang, { templateId, postId, title }) =>
  upsertRoute(parentId, segment, segment, {
    templateId,
    ...seoDefaults(lang.code, { title }),
    source: { postIds: [postId], postTypes: [], dataSources: [] },
  });

// ---------------------------------------------------------------- audit

// Read-only. Everything a hand-authored multilanguage setup can get wrong.
const i18nAudit = async (languages, typeKeys = ['page'], navType = 'nav_item') => {
  const problems = [];
  const info = {};
  const add = (check, detail) => problems.push(`${check}: ${detail}`);
  const prefixOf = (code) => (languages.find((l) => l.code === code) || {}).prefix;

  const paths = await etch.routes.getPathsAsync();
  const published = new Set(paths.filter((p) => p.status === 'published').map((p) => p.path));
  for (const p of paths.filter((p) => p.status !== 'published')) {
    add('route not published', `${p.path} is ${p.status}`);
  }
  info.publishedPaths = [...published].sort();

  const routes = await etch.routes.listAsync();
  info.routeLanguages = routes.map((r) => `${r.segment || '(root)'}=${r.language || '(inherits)'}`);

  const all = [];
  for (const t of typeKeys) {
    for (const i of await etch.content.listItemsAsync(t)) all.push({ ...i, type: t });
  }
  const byId = new Map(all.map((i) => [i.id, i]));
  const idsOf = (list) => (Array.isArray(list) ? list : []).map((t) => (t && typeof t === 'object' ? t.id : t));

  for (const i of all) {
    const f = i.fields || {};
    const where = `${i.type} #${i.id} "${i.title}"`;

    if (!f.language) add('missing language', where);
    else if (!prefixOf(f.language)) add('unknown language', `${where} -> ${f.language}`);

    if (!f.path) add('missing path', where);
    else if (!published.has(f.path)) add('path is not a published URL', `${where} -> ${f.path}`);
    else if (f.language && prefixOf(f.language) && !f.path.startsWith(prefixOf(f.language))) {
      add('path outside its language tree', `${where} -> ${f.path} (${f.language})`);
    }

    const ids = idsOf(f.translations);
    for (const otherId of ids) {
      const other = byId.get(otherId);
      if (!other) { add('translation points at a missing item', `${where} -> #${otherId}`); continue; }
      if (other.type !== i.type) add('translation crosses content types', `${where} -> ${other.type} #${otherId}`);
      if ((other.fields || {}).language === f.language) {
        add('translation has the same language', `${where} -> "${other.title}"`);
      }
      if (!idsOf((other.fields || {}).translations).includes(i.id)) {
        add('hreflang not reciprocal', `${where} -> "${other.title}" does not link back`);
      }
    }
    const langs = ids.map((id) => ((byId.get(id) || { fields: {} }).fields || {}).language).filter(Boolean);
    if (new Set(langs).size !== langs.length) add('two translations share a language', where);
  }

  // exactly one x-default per translation group
  const seen = new Set();
  for (const i of all) {
    if (seen.has(i.id)) continue;
    const group = [i.id, ...idsOf((i.fields || {}).translations)].filter((id) => byId.has(id));
    group.forEach((id) => seen.add(id));
    const names = group.map((id) => byId.get(id).title).join(' / ');
    const defaults = group.filter((id) => (byId.get(id).fields || {}).xDefault);
    if (defaults.length === 0) add('group has no x-default', names);
    if (defaults.length > 1) add('group has several x-defaults', names);
  }

  if ((await etch.content.listTypesAsync()).some((t) => t.key === navType)) {
    for (const n of await etch.content.listItemsAsync(navType)) {
      const href = (n.fields || {}).href;
      if (!href) add('nav item without href', n.title);
      else if (!published.has(href)) add('nav link is not a published URL', `${n.title} -> ${href}`);
    }
  }

  info.byLanguage = {};
  for (const l of languages) {
    const mine = all.filter((i) => (i.fields || {}).language === l.code);
    info.byLanguage[l.code] = {
      items: mine.length,
      paths: mine.map((i) => (i.fields || {}).path).filter(Boolean).sort(),
      untranslated: mine.filter((i) => !idsOf((i.fields || {}).translations).length).map((i) => i.title),
    };
  }
  const claimed = new Set(all.map((i) => (i.fields || {}).path).filter(Boolean));
  info.unclaimedPaths = [...published].filter((p) => !claimed.has(p));

  return { ok: problems.length === 0, problems, info };
};
