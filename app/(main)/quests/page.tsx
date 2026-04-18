import Image from "next/image";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Progress } from "@/components/ui/progress";
import { UserProgress } from "@/components/user-progress";
import { QUESTS } from "@/constants";
import { api } from "@/lib/api";
import { getLocaleFromCourse, getTranslations } from "@/lib/i18n";
import type { UserProgress as UserProgressType } from "@/types/api";

const QuestsPage = async () => {
  let userProgress: UserProgressType | null = null;

  try {
    userProgress = await api<UserProgressType>("/api/v1/users/me/progress");
  } catch {
    redirect("/login");
  }

  if (!userProgress || !userProgress.activeCourse) redirect("/courses");

  const t = getTranslations(getLocaleFromCourse(userProgress.activeCourse?.title));

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={userProgress.activeCourse}
          hearts={userProgress.hearts}
          points={userProgress.points}
        />
      </StickyWrapper>

      <FeedWrapper>
        <div className="flex w-full flex-col items-center">
          <Image src="/quests.svg" alt="Quests" height={90} width={90} />

          <h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
            {t.quests}
          </h1>
          <p className="mb-6 text-center text-lg text-muted-foreground">
            {t.completeQuestsHint}
          </p>

          <ul className="w-full">
            {QUESTS.map((quest) => {
              const progress = (userProgress!.points / quest.value) * 100;

              return (
                <div
                  className="flex w-full items-center gap-x-4 border-t-2 p-4"
                  key={quest.value}
                >
                  <Image
                    src="/points.svg"
                    alt="Points"
                    width={60}
                    height={60}
                  />

                  <div className="flex w-full flex-col gap-y-2">
                    <p className="text-xl font-bold text-neutral-700">
                      {t.earnXP(quest.value)}
                    </p>

                    <Progress value={progress} className="h-3" />
                  </div>
                </div>
              );
            })}
          </ul>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default QuestsPage;
