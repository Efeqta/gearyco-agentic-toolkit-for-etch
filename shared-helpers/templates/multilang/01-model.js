// 1/6 — content types, i18n fields, items, translation links and nav.
//
// `path` is authored by hand: it is what hreflang and nav link to. Keep it in
// step with 05-routes, and run 99-verify to prove it.
return task(async () => {
  // Create any extra translatable types first. Keys must be lowercase.
  // if (!(await etch.content.listTypesAsync()).some(t => t.key === 'news')) {
  //   await etch.content.createTypeAsync({ name: 'News', key: 'news' });
  // }

  for (const t of TYPES) await ensureI18nFields(t, LANGUAGES);
  await ensureNavType(LANGUAGES);

  // ---- pages ----
  // A language's home page has slug '' (a static route serves it) and its
  // prefix as `path`. Exactly ONE member of each translation group gets
  // xDefault: true — it is the URL every page of the group points x-default at.
  const P = {};
  P.enHome = await ensureItem('page', 'Home', { language: 'en', slug: '', path: '/', xDefault: true });
  P.enAbout = await ensureItem('page', 'About us', { language: 'en', slug: 'about-us', path: '/about-us/', xDefault: true });
  P.deHome = await ensureItem('page', 'Startseite', { language: 'de', slug: '', path: '/de/' });
  P.deAbout = await ensureItem('page', 'Über uns', { language: 'de', slug: 'ueber-uns', path: '/de/ueber-uns/' });

  // Both directions, always: hreflang is ignored unless it is reciprocal.
  await linkTranslations([P.enHome, P.deHome]);
  await linkTranslations([P.enAbout, P.deAbout]);

  // A page with no counterpart gets an empty list and emits only its own
  // self-reference — never invent a translation that does not exist.
  // const deOnly = await ensureItem('page', 'Nur Deutsch', { language: 'de', slug: 'nur-deutsch', path: '/de/nur-deutsch/', xDefault: true });
  // await etch.content.updateItemAsync(deOnly, { fields: { translations: [] } });

  // ---- nav, authored per language ----
  // Nothing forces the languages to match: list different pages, or fewer.
  const navSpec = [
    { language: 'en', label: 'Home', href: '/', order: 1 },
    { language: 'en', label: 'About us', href: '/about-us/', order: 2 },
    { language: 'de', label: 'Startseite', href: '/de/', order: 1 },
    { language: 'de', label: 'Über uns', href: '/de/ueber-uns/', order: 2 },
  ];
  for (const n of navSpec) await ensureItem('nav_item', `${n.language}: ${n.label}`, n);

  return { pages: P, nav: navSpec.length };
});
