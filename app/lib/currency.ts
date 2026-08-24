"use client";

import { useCallback, useEffect, useState } from "react";

// حالة العملة المشتركة عبر التطبيق — تُحفظ في localStorage وتُبثّ لكل المكوّنات.
export type Currency = "USD" | "IQD";

const KEY = "goldary:currency";
const EVT = "goldary:currency-change";

export function readCurrency(): Currency {
  if (typeof window === "undefined") return "IQD";
  return window.localStorage.getItem(KEY) === "USD" ? "USD" : "IQD";
}

export function writeCurrency(c: Currency) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, c);
  window.dispatchEvent(new CustomEvent(EVT, { detail: c }));
}

// hook: يعيد [العملة، دالة التبديل] ويتزامن بين كل المكوّنات والتبويبات.
export function useCurrency(): [Currency, (c: Currency) => void] {
  const [currency, setCurrencyState] = useState<Currency>("IQD");

  useEffect(() => {
    setCurrencyState(readCurrency());
    const onChange = () => setCurrencyState(readCurrency());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    writeCurrency(c);
  }, []);

  return [currency, setCurrency];
}
