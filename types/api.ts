// TypeScript interfaces mirroring FastAPI response schemas.
// Keep in sync with server/app/schemas/

export type ChallengeType = "SELECT" | "ASSIST";

export type ExerciseType =
  | "COMPLETE_CONVERSATION"
  | "ARRANGE_WORDS"
  | "COMPLETE_TRANSLATION"
  | "PICTURE_MATCH"
  | "TYPE_HEAR"
  | "LISTEN_FILL"
  | "SPEAK_SENTENCE";

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
  id: string;
  title: string;
  order: number;
  completed: boolean;
}

export interface UnitSummary {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: (LessonSummary & { completed: boolean })[];
}

export interface Course {
  id: string;
  title: string;
  imageSrc: string;
}

export interface UserProgress {
  userId: string;
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

// ---------------------------------------------------------------------------
// New Exercise Engine types (Spec §6)
// ---------------------------------------------------------------------------

/** Text selectable option */
export interface OptionText {
  id: string;
  text: string;
}

/** Image selectable option */
export interface OptionImage {
  id: string;
  text: string;
  image_url: string;
}

/** Word bank item for LISTEN_FILL */
export interface WordBankItem {
  id: string;
  text: string;
}

export interface CompleteConversationData {
  instruction: string;
  text: string;
  options: OptionText[];
}

export interface ArrangeWordsData {
  instruction: string;
  tokens: string[];
}

export interface CompleteTranslationData {
  instruction: string;
  source_sentence: string;
  text_template: string;
}

export interface PictureMatchData {
  instruction: string;
  word: string;
  options: OptionImage[];
}

export interface TypeHearData {
  instruction: string;
  text: string; // TTS source
}

export interface ListenFillData {
  instruction: string;
  text: string;
  word_bank: WordBankItem[];
}

export interface SpeakSentenceData {
  instruction: string;
  sentence: string;
}

export interface Exercise {
  id: string;
  lesson_id: string;
  type: ExerciseType;
  question_data:
    | CompleteConversationData
    | ArrangeWordsData
    | CompleteTranslationData
    | PictureMatchData
    | TypeHearData
    | ListenFillData
    | SpeakSentenceData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answer_data: Record<string, any>;
}

export interface ExerciseLessonPayload {
  id: string;
  unit_id: string;
  lesson_form_id: string;
  title: string;
  order_index: number;
  exercises: Exercise[];
}

export interface AnswerDetail {
  exercise_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent_ms: number;
}

export interface LessonSubmission {
  answers: AnswerDetail[];
  score: number;
  hearts_left: number;
  started_at?: string;
  finished_at?: string;
}

export interface ProgressResponse {
  xp_earned: number;
  total_xp: number;
  current_streak: number;
  hearts: number;
  gems: number;
}
