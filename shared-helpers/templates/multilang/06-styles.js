// 6/6 — the minimum CSS the header, switcher and hero need. Replace with the
// real design; this exists so the starter is legible on first deploy.
//
// CSS for a block's class belongs in etch.styles (what applyStyles writes),
// never in a global stylesheet. Flat BEM selectors, states nested inside.
return task(async () => {
  applyStyles({
    '.site-header': 'background-color: #1b1b1f; color: #fff; padding-block: to-rem(16px);',
    '.site-header__inner': 'flex-direction: row; align-items: center; gap: to-rem(24px); flex-wrap: wrap;',
    '.site-header__brand': 'color: #fff; font-weight: 700; text-decoration: none;',
    '.site-nav': 'margin-inline-end: auto;',
    '.site-nav__list': 'display: flex; gap: to-rem(16px); list-style: none; margin: 0; padding: 0;',
    '.site-nav__item': 'margin: 0;',
    '.site-nav__link': 'color: #fff; text-decoration: none;\n\n&:hover { text-decoration: underline; }',
    '.lang-switch': 'display: flex; gap: to-rem(8px); list-style: none; margin: 0; padding: 0;',
    '.lang-switch__item': 'margin: 0;',
    '.lang-switch__current': 'display: inline-block; background-color: #fff; color: #1b1b1f; border: 1px solid #fff; border-radius: to-rem(4px); padding: to-rem(2px) to-rem(8px); text-transform: uppercase; font-size: to-rem(12px); font-weight: 700;',
    '.lang-switch__link': 'display: inline-block; color: #fff; border: 1px solid currentColor; border-radius: to-rem(4px); padding: to-rem(2px) to-rem(8px); text-decoration: none; text-transform: uppercase; font-size: to-rem(12px);\n\n&:hover { background-color: #fff; color: #1b1b1f; }',
    '.hero': 'padding-block: to-rem(64px);',
    '.hero__title': 'font-size: clamp(to-rem(32px), 5vw, to-rem(56px)); margin: 0 0 to-rem(16px);',
    '.hero__lead': 'font-size: to-rem(18px); margin: 0;',
    '.site-footer': 'background-color: #1b1b1f; color: #fff; padding-block: to-rem(32px);',
    '.site-footer__text': 'margin: 0;',
  });
  await etch.saveAsync();
  return { selectors: etch.styles.list().length };
});
