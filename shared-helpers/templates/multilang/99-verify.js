// Read-only i18n audit. Run before every deploy.
//
// Checks: every `path` is a really published URL and sits under its language's
// prefix; hreflang is reciprocal; exactly one x-default per group; no
// translation pointing at the same language, a missing item or another type;
// every nav href is published; which items have no translation; and any
// published URL no item claims.
return task(() => i18nAudit(LANGUAGES, TYPES));
