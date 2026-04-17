import { redirect } from "next/navigation";

import { api } from "@/lib/api";
import type { ExerciseLessonPayload, UserProgress } from "@/types/api";

import { ExerciseQuiz } from "./exercise-quiz";

/** Active lesson shortcut — fetches the active lesson and renders ExerciseQuiz. */
const LessonPage = async () => {
  let lesson: ExerciseLessonPayload | null = null;
  let userProgress: UserProgress | null = null;

  try {
    [lesson, userProgress] = await Promise.all([
      api<ExerciseLessonPayload>("/api/v1/lessons/active/payload"),
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
    />
  );
};

export default LessonPage;
