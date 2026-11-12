import { Language } from '../../types';
import { TranslationKeys } from './types';
import { en } from './en';
import { hi } from './hi';
import { ta } from './ta';
import { te } from './te';
import { bn } from './bn';
import { mr } from './mr';
import { gu, kn, ml, pa, or, as, ur } from './languagesPack1';
import { bho, raj, mag, mai, hne, bgc, mwr, sat } from './languagesPack2';

export const TRANSLATIONS: Record<Language, TranslationKeys> = {
  en,
  hi,
  bn,
  mr,
  te,
  ta,
  gu,
  ur,
  kn,
  or,
  ml,
  pa,
  bho,
  raj,
  as,
  mag,
  mai,
  hne,
  bgc,
  mwr,
  sat,
};

export function getTranslation(
  lang: Language,
  key: keyof TranslationKeys,
  params?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key] || (key as string);

  if (params) {
    Object.entries(params).forEach(([paramKey, val]) => {
      text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(val));
    });
  }

  return text;
}
