import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { Quests } from "@/components/quests";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { api } from "@/lib/api";
import type { CourseProgress, UnitSummary, UserProgress as UserProgressType } from "@/types/api";

import { Header } from "./header";
import { Unit } from "./unit";

const LearnPage = async () => {
  let userProgress: UserProgressType | null = null;
  let units: UnitSummary[] = [];
  let courseProgress: CourseProgress | null = null;

  try {
    [userProgress, units, courseProgress] = await Promise.all([
      api<UserProgressType>("/api/v1/users/me/progress"),
      api<UnitSummary[]>("/api/v1/courses/active/units"),
      api<CourseProgress>("/api/v1/users/me/course-progress"),
    ]);
  } catch {
    redirect("/login");
  }

  if (!courseProgress || !userProgress || !userProgress.activeCourse) {
    redirect("/courses");
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={userProgress.activeCourse}
          hearts={userProgress.hearts}
          points={userProgress.points}
        />
        <Quests points={userProgress.points} />
      </StickyWrapper>
      <FeedWrapper>
        <Header title={userProgress.activeCourse.title} />
        {units.map((unit) => (
          <div key={unit.id} className="mb-10">
            <Unit
              id={unit.id}
              order={unit.order}
              description={unit.description}
              title={unit.title}
              lessons={unit.lessons}
              activeLesson={courseProgress!.activeLesson}
              activeLessonPercentage={courseProgress!.activeLessonPercentage}
            />
          </div>
        ))}
      </FeedWrapper>
    </div>
  );
};

export default LearnPage;
