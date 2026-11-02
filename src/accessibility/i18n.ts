/**
 * Sistema de traducción ES/EN.
 * Español por defecto; inglés para demo y evaluación del hackathon.
 */

import { useState, useCallback } from 'react';
import { es, type TranslationKey } from '@/i18n/es';
import { en } from '@/i18n/en';

export type Lang = 'es' | 'en';

/** Tipo de la función de traducción, compartido por todos los componentes. */
export type TFunc = (key: TranslationKey, params?: Record<string, string | number>) => string;

const STORAGE_KEY = 'combirumbo-lang';
const dictionaries: Record<Lang, Record<TranslationKey, string>> = { es, en };

/** Traduce una clave con interpolación de {placeholders}. */
export function translate(key: TranslationKey, lang: Lang, params?: Record<string, string | number>): string {
  const dict = dictionaries[lang] ?? es;
  let text = dict[key] ?? es[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

/** Hook para usar traducciones en componentes. */
export function useI18n() {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'es' || stored === 'en') return stored;
    }
    return 'es';
  });

  const changeLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(key, lang, params),
    [lang]
  );

  return { t, lang, setLang: changeLang };
}
