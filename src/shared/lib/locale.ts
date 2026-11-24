export type AppLocale = 'en' | 'fr';

let appLocale: AppLocale = resolveAppLocale();

export function resolveAppLocale(tag?: string | null): AppLocale {
  const source = (
    tag ??
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().locale
      : 'en')
  ).toLowerCase();
  return source.startsWith('fr') ? 'fr' : 'en';
}

export function getAppLocale(): AppLocale {
  return appLocale;
}

/** Call when the in-app language changes, then refresh hubs. */
export function setAppLocale(locale: AppLocale): void {
  appLocale = locale;
}
