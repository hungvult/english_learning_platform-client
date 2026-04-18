"use client";

import { createContext, useContext } from "react";

import { getTranslations } from "@/lib/i18n";
import type { Locale, Translations } from "@/lib/i18n";

type LocaleContextType = {
  locale: Locale;
  t: Translations;
};

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  t: getTranslations("en"),
});

export const LocaleProvider = ({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) => {
  return (
    <LocaleContext.Provider value={{ locale, t: getTranslations(locale) }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);
