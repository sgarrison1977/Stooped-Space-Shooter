// Tiny i18n: t("English text", vars) looks the English string up in the translation table.
// Missing rows fall back to English. setLang() swaps the table; the root layout remounts on change.
import { useSyncExternalStore } from "react";
import { getLocales } from "expo-localization";
import { UI_ROWS } from "./strings-ui";
import { DATA_ROWS } from "./strings-data";

export type LangId = "en" | "es" | "pt" | "de" | "ja";
export const LANGS: { id: string; name: string }[] = [
  { id: "auto", name: "Auto" }, { id: "en", name: "English" }, { id: "es", name: "Español" },
  { id: "pt", name: "Português" }, { id: "de", name: "Deutsch" }, { id: "ja", name: "日本語" },
];
const COL: Record<LangId, number> = { en: 0, es: 1, pt: 2, de: 3, ja: 4 };

let lang: LangId = "en";
let dict = new Map<string, string>();
const listeners = new Set<() => void>();

export function resolveLang(pref: string): LangId {
  if (pref && pref !== "auto" && pref in COL) return pref as LangId;
  const code = getLocales()[0]?.languageCode ?? "en";
  return (code in COL ? code : "en") as LangId;
}

export function setLang(pref: string) {
  const next = resolveLang(pref);
  dict = new Map();
  if (next !== "en") for (const r of [...UI_ROWS, ...DATA_ROWS]) if (r[COL[next]]) dict.set(r[0], r[COL[next]]);
  lang = next;
  listeners.forEach((l) => l());
}

export const currentLang = () => lang;

export function t(en: string, vars?: Record<string, string | number>) {
  let s = lang === "en" ? en : dict.get(en) ?? en;
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

export function useLang() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => lang, () => lang);
}
