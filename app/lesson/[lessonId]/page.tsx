import { redirect } from "next/navigation";

import { api } from "@/lib/api";
import type { ExerciseLessonPayload, UserProgress } from "@/types/api";

import { ExerciseQuiz } from "../exercise-quiz";

type LessonIdPageProps = {
  params: Promise<{
    lessonId: string;
  }>;
  searchParams: Promise<{
    preview?: string;
  }>;
};

const LessonIdPage = async ({ params, searchParams }: LessonIdPageProps) => {
  const { lessonId } = await params;
  const { preview } = await searchParams;
  const isPreviewMode = preview === "1" || preview === "true";

  let lesson: ExerciseLessonPayload | null = null;
  let userProgress: UserProgress | null = null;

  try {
    [lesson, userProgress] = await Promise.all([
      api<ExerciseLessonPayload>(`/api/v1/lessons/${lessonId}/payload`),
      api<UserProgress>("/api/v1/users/me/progress"),
    ]);
  } catch {
    redirect("/learn");
  }

  if (!lesson || !userProgress) redirect("/learn");

  return (
    <ExerciseQuiz
      lesson={lesson}
      initialHearts={userProgress.hearts}
      mode={isPreviewMode ? "PREVIEW" : "PRACTICE"}
    />
  );
};

export default LessonIdPage;
