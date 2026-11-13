// 2/6 — data sources.
//
// Two different mechanisms, and the difference matters:
//   * ROUTE sources take a bare key and CANNOT receive arguments, so each
//     (type, language) pair needs its own: pagesEn, pagesDe, newsEn, ...
//   * TEMPLATE lookups DO take arguments: data('navFor', this.fields.language).
//     Dynamic bracket keys do not work, so never data('strings')[lang].
return task(async () => {
  const routeKeys = await upsertLanguageSources(TYPES, LANGUAGES);
  const helperKeys = await upsertLanguageHelpers(LANGUAGES, STRINGS);

  // One per extra type you want to list on a page:
  // await upsertListingSource('news', 'newsFor');

  return { routeKeys, helperKeys };
});
