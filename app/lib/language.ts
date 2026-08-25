"use client";

import { useCallback, useEffect, useState } from "react";

// حالة اللغة المشتركة عبر التطبيق — تُحفظ في localStorage وتُبثّ لكل المكوّنات.
export type Lang = "ar" | "en";

const KEY = "goldary:lang";
const EVT = "goldary:lang-change";

export function readLang(): Lang {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem(KEY) === "en" ? "en" : "ar";
}

export function writeLang(l: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, l);
  window.dispatchEvent(new CustomEvent(EVT, { detail: l }));
}

// hook: يعيد [اللغة، دالة التبديل] ويتزامن بين كل المكوّنات والتبويبات.
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    setLangState(readLang());
    const onChange = () => setLangState(readLang());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    writeLang(l);
  }, []);

  return [lang, setLang];
}
