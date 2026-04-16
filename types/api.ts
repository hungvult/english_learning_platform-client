// TypeScript interfaces mirroring FastAPI response schemas.
// Keep in sync with server/app/schemas/.

export type ChallengeType = "SELECT" | "ASSIST";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ChallengeOption {
  id: number;
  challengeId: number;
  text: string;
  correct: boolean;
  imageSrc: string | null;
  audioSrc: string | null;
}

export interface Challenge {
  id: number;
  lessonId: number;
  type: ChallengeType;
  question: string;
  order: number;
  completed: boolean;
  challengeOptions: ChallengeOption[];
}

export interface LessonPayload {
  id: number;
  title: string;
  order: number;
  unitId: number;
  challenges: Challenge[];
}

export interface LessonSummary {
  id: number;
  title: string;
  order: number;
  completed: boolean;
}

export interface UnitSummary {
  id: number;
  courseId: number;
  title: string;
  description: string;
  order: number;
  lessons: (LessonSummary & { completed: boolean })[];
}

export interface Course {
  id: number;
  title: string;
  imageSrc: string;
}

export interface UserProgress {
  userId: number;
  activeCourse: Course | null;
  hearts: number;
  points: number;
  streak: number;
}

export interface ActiveLesson extends LessonSummary {
  unit: UnitSummary;
}

export interface CourseProgress {
  activeLesson: ActiveLesson | undefined;
  activeLessonPercentage: number;
}

/** Payload sent to POST /api/v1/lessons/{id}/complete */
export interface LessonCompletePayload {
  score: number;
  heartsLeft: number;
  mistakeCount: number;
  startedAt: string; // ISO timestamp
  completedAt: string; // ISO timestamp
}

export interface LessonCompleteResponse {
  xpEarned: number;
  newStreak: number;
  heartsAfter: number;
  pointsAfter: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  cefr_level: string | null;
  total_xp: number;
  hearts: number;
  gems: number;
  current_streak: number;
  is_admin: boolean;
}
