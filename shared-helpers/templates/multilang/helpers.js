// Copy to projects/<project>/etch/helpers.js and edit. This is the ONLY file
// you should need to change to re-point the starter at a different site.
//
// Rules and gotchas: agent-docs/etch-multilanguage.md
// Helpers used below: shared-helpers/etch/i18n.js

// The language whose `prefix` is '/' lives at the site root; the rest get a
// static `segment`. Order matters only in that the first is the fallback.
const LANGUAGES = [
  { code: 'en', label: 'English', prefix: '/' },
  { code: 'de', label: 'Deutsch', prefix: '/de/', segment: 'de' },
  // { code: 'fr', label: 'Français', prefix: '/fr/', segment: 'fr' },
];

// Interface text, per language. Kept as a JSON data source so it can be edited
// in the Data Manager; read it with
//   {data('stringsFor', this.fields.language).rights}
const STRINGS = {
  en: { rights: 'All rights reserved', langLabel: 'Language', nav: 'Main menu' },
  de: { rights: 'Alle Rechte vorbehalten', langLabel: 'Sprache', nav: 'Hauptmenü' },
};

// Route SEO applied to every language branch.
const TITLE = '{this.fields.metaTitle || this.title} — {site.name}';

// Translatable content types. Add more as you create them, e.g. ['page', 'news'].
const TYPES = ['page'];

// What each language's route tree looks like. A language that is missing a
// branch simply does not get that part of the site — this is how you give one
// language only a home page.
const PLAN = {
  en: { home: 'Home', pages: 'pagesEn' },
  de: { home: 'Startseite', pages: 'pagesDe' },
  // fr: { home: 'Accueil' },                              // home only
  // en: { home: 'Home', pages: 'pagesEn',
  //       news: { listing: 'News', source: 'newsEn' } },  // with a second type
};
