import { redirect } from "next/navigation";

import { api } from "@/lib/api";
import type { LessonPayload, UserProgress } from "@/types/api";

import { Quiz } from "../quiz";

type LessonIdPageProps = {
  params: Promise<{
    lessonId: string;
  }>;
};

const LessonIdPage = async ({ params }: LessonIdPageProps) => {
  const { lessonId } = await params;

  let lesson: LessonPayload | null = null;
  let userProgress: UserProgress | null = null;

  try {
    [lesson, userProgress] = await Promise.all([
      api<LessonPayload>(`/api/v1/lessons/${lessonId}`),
      api<UserProgress>("/api/v1/users/me/progress"),
    ]);
  } catch {
    redirect("/learn");
  }

  if (!lesson || !userProgress) redirect("/learn");

  const initialPercentage =
    (lesson.challenges.filter((c) => c.completed).length /
      lesson.challenges.length) *
    100;

  return (
    <Quiz
      initialLessonId={lesson.id}
      initialLessonChallenges={lesson.challenges}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
    />
  );
};

export default LessonIdPage;
