// 4/6 — the single `index` template every language renders through.
//
// Nothing in here is per-language. It reads the record's own `language` field
// and looks up nav, strings and the home href by that. Adding a language means
// touching helpers.js and 01-model.js, never this file.
return task(async () => {
  const C = componentIds(['SiteHeader', 'SiteFooter']);
  const LANG = 'this.fields.language';

  const templateId = await buildTemplate('index', [
    hreflangHead(), // self + each translation + one x-default + canonical
    instance('Site Header', C.SiteHeader, {
      language: ex(LANG),
      homeHref: ex(`data('langHome', ${LANG})`),
    }),
    el('main', 'Main', [render('this.content')], { id: 'content' }),
    instance('Site Footer', C.SiteFooter, { language: ex(LANG) }),
  ]);

  // ---- page bodies, keyed by item title ----
  const hero = (h1, lead) => section('hero', 'Hero', [
    container('hero__inner', 'Inner', [
      el('h1', 'Title', [txt(h1)], { class: 'hero__title' }),
      el('p', 'Lead', [txt(lead)], { class: 'hero__lead' }),
    ]),
  ]);

  // A listing that works in any language: it reads its own record's language.
  // const listing = () => section('news-list-section', 'News list section', [
  //   container('news-list-section__inner', 'Inner', [
  //     el('h1', 'Title', [txt(ex('this.title'))], { class: 'hero__title' }),
  //     el('ul', 'News list', [
  //       loop(`data('newsFor', ${LANG})`, 'post', [
  //         el('li', 'News card', [
  //           el('a', 'News link', [txt(ex('post.title'))], { class: 'news-card__link', href: ex('post.path') }),
  //         ], { class: 'news-card' }),
  //       ], 'News loop'),
  //     ], { class: 'news-list', role: 'list' }),
  //   ]),
  // ]);

  const bodies = {
    'Home': [hero('Welcome', 'English home page.')],
    'About us': [hero('About us', 'English about page.')],
    'Startseite': [hero('Willkommen', 'Deutsche Startseite.')],
    'Über uns': [hero('Über uns', 'Deutsche Über-uns-Seite.')],
  };

  const byTitle = {};
  for (const t of TYPES) {
    for (const i of await etch.content.listItemsAsync(t)) byTitle[i.title] = i.id;
  }

  const built = [];
  for (const [title, blocks] of Object.entries(bodies)) {
    if (!byTitle[title]) continue;
    await etch.navigation.openPostAsync(byTitle[title]);
    await replaceTree(blocks);
    built.push(title);
  }
  return { templateId, built };
});
