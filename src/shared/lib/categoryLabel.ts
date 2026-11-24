import {HubCategory} from '@shared/types/hub';
import {AppLocale} from '@shared/lib/locale';

export function categoryLabel(
  value: string | null | undefined,
  categories: HubCategory[],
  locale?: AppLocale,
): string {
  if (!value) return '';
  const match = categories.find(c => c.value === value);
  if (!match) return value;
  if (locale && match.labels?.[locale]) return match.labels[locale];
  return match.label || value;
}
