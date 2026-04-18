import type { PropsWithChildren } from "react";

import { ExitModal } from "@/components/modals/exit-modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import { LocaleProvider } from "@/components/locale-provider";
import { api } from "@/lib/api";
import { getLocaleFromCourse } from "@/lib/i18n";
import type { UserProgress } from "@/types/api";

const LessonLayout = async ({ children }: PropsWithChildren) => {
  let locale: "en" | "vi" = "en";

  try {
    const userProgress = await api<UserProgress>("/api/v1/users/me/progress");
    locale = getLocaleFromCourse(userProgress.activeCourse?.title);
  } catch {
    // Not logged in or no active course — default to English.
  }

  return (
    <LocaleProvider locale={locale}>
      <ExitModal />
      <HeartsModal />
      <PracticeModal />
      <div className="flex h-full flex-col">
        <div className="flex h-full w-full flex-col">{children}</div>
      </div>
    </LocaleProvider>
  );
};

export default LessonLayout;
