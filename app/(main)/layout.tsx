import type { PropsWithChildren } from "react";

import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";
import { LocaleProvider } from "@/components/locale-provider";
import { api } from "@/lib/api";
import { getLocaleFromCourse } from "@/lib/i18n";
import type { UserProgress } from "@/types/api";

const MainLayout = async ({ children }: PropsWithChildren) => {
  let locale: "en" | "vi" = "en";

  try {
    const userProgress = await api<UserProgress>("/api/v1/users/me/progress");
    locale = getLocaleFromCourse(userProgress.activeCourse?.title);
  } catch {
    // Not logged in or no active course — default to English.
  }

  return (
    <LocaleProvider locale={locale}>
      <MobileHeader />
      <Sidebar className="hidden lg:flex" />
      <main className="h-full pt-[50px] lg:pl-[256px] lg:pt-0">
        <div className="mx-auto h-full max-w-[1056px] pt-6">{children}</div>
      </main>
    </LocaleProvider>
  );
};

export default MainLayout;
