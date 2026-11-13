// 3/6 — one header for every language.
//
// The nav is driven by the `language` prop, so each language can list
// completely different pages. The language switcher instead reads the record
// being rendered (this.fields.translations), which works inside a component —
// that is why there is no second header component per language.
return task(async () => {
  const S = (key) => `data('stringsFor', props.language).${key}`;

  const headerId = await upsertComponent({
    name: 'Site Header',
    key: 'SiteHeader',
    properties: [
      prop.text('Language', 'language', LANGUAGES[0].code),
      prop.text('Home href', 'homeHref', LANGUAGES[0].prefix),
    ],
    blocks: [
      el('header', 'Site header', [
        container('site-header__inner', 'Inner', [
          el('a', 'Brand', [txt('{site.name}')], { class: 'site-header__brand', href: ex('props.homeHref') }),

          el('nav', 'Main nav', [
            el('ul', 'Nav list', [
              loop("data('navFor', props.language)", 'nav', [
                el('li', 'Nav item', [
                  el('a', 'Nav link', [txt(ex('nav.label'))], { class: 'site-nav__link', href: ex('nav.href') }),
                ], { class: 'site-nav__item' }),
              ], 'Nav loop'),
            ], { class: 'site-nav__list', role: 'list' }),
          ], { class: 'site-nav', 'aria-label': ex(S('nav')) }),

          el('ul', 'Language switcher', [
            el('li', 'Current', [
              el('span', 'Current code', [txt(ex('this.fields.language'))], {
                class: 'lang-switch__current', 'aria-current': 'true', lang: ex('this.fields.language'),
              }),
            ], { class: 'lang-switch__item' }),
            loop('this.fields.translations', 't', [
              el('li', 'Alt', [
                el('a', 'Alt link', [txt(ex('t.fields.language'))], {
                  class: 'lang-switch__link', href: ex('t.fields.path'),
                  hreflang: ex('t.fields.language'), lang: ex('t.fields.language'),
                }),
              ], { class: 'lang-switch__item' }),
            ], 'Translations loop'),
          ], { class: 'lang-switch', role: 'list', 'aria-label': ex(S('langLabel')) }),
        ]),
      ], { class: 'site-header' }),
    ],
  });

  const footerId = await upsertComponent({
    name: 'Site Footer',
    key: 'SiteFooter',
    properties: [prop.text('Language', 'language', LANGUAGES[0].code)],
    blocks: [
      el('footer', 'Site footer', [
        container('site-footer__inner', 'Inner', [
          el('p', 'Rights', [txt(`{site.name} — ${ex(S('rights'))}`)], { class: 'site-footer__text' }),
        ]),
      ], { class: 'site-footer' }),
    ],
  });

  return { headerId, footerId };
});
