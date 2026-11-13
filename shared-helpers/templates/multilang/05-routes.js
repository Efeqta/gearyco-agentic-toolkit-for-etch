// 5/6 — the route tree. A route's `language` is what becomes <html lang>, and
// it inherits down the tree. PLAN in helpers.js decides which branches each
// language gets, so a language can have nothing but a home page.
return task(async () => {
  const templateId = (await etch.navigation.listTemplatesAsync()).find((t) => t.title === 'index').id;
  const seo = { templateId, title: TITLE };
  const idOf = async (postType, title) =>
    (await etch.content.listItemsAsync(postType)).find((i) => i.title === title).id;

  const routeIds = {};
  for (const lang of LANGUAGES) {
    const p = PLAN[lang.code];
    if (!p) continue;

    const langRoot = await upsertLanguageRoot(lang, { ...seo, homeId: await idOf('page', p.home) });
    routeIds[`${lang.code}:root`] = langRoot;

    if (p.pages) {
      routeIds[`${lang.code}:pages`] = await upsertDynamicBranch(langRoot, lang, { ...seo, sourceKey: p.pages });
    }
    if (p.news) {
      const listing = await upsertStaticBranch(langRoot, 'news', lang, { ...seo, postId: await idOf('page', p.news.listing) });
      routeIds[`${lang.code}:news`] = listing;
      routeIds[`${lang.code}:article`] = await upsertDynamicBranch(listing, lang, { ...seo, sourceKey: p.news.source });
    }
  }

  // Only `published` paths are built. Anything else means a conflict.
  return { routeIds, paths: (await etch.routes.getPathsAsync()).map((p) => `${p.status}\t${p.path}`) };
});
