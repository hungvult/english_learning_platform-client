"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { toast } from "sonner";

import { MAX_HEARTS } from "@/constants";
import { api } from "@/lib/api";
import { usePreferences } from "@/store/use-preferences";
import { useLocale } from "@/components/locale-provider";
import type { Translations } from "@/lib/i18n";
import type {
  Exercise,
  ExerciseLessonPayload,
  AnswerDetail,
  LessonSubmission,
  ProgressResponse,
} from "@/types/api";

import { ExerciseEngine } from "@/components/exercises/exercise-engine";
import { Header } from "./header";
import { Footer } from "./footer";

// ---------------------------------------------------------------------------
// Format correct answer for display (from server answer_data)
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCorrectAnswerString(exercise: Exercise, answerData: any): string | undefined {
  if (!answerData) return undefined;

  switch (exercise.type) {
    case "COMPLETE_CONVERSATION":
    case "PICTURE_MATCH": {
      const correctId = answerData.correct_option_id;
      const opts = (exercise.question_data as any).options || [];
      const match = opts.find((opt: any) => opt.id === correctId);
      return match ? match.text : undefined;
    }
    case "ARRANGE_WORDS":
      return (answerData.correct_sequence || []).join(" ");
    case "COMPLETE_TRANSLATION":
      return (answerData.correct_words || []).join(", ");
    case "TYPE_HEAR":
      return answerData.correct_transcription;
    case "LISTEN_FILL": {
      const correctIds = answerData.correct_sequence_ids || [];
      const wordBank = (exercise.question_data as any).word_bank || [];
      return correctIds
        .map((id: string) => wordBank.find((w: any) => w.id === id)?.text)
        .filter(Boolean)
        .join(" ");
    }
    case "SPEAK_SENTENCE":
      // User feedback: "Ignore speak_sentences"
      return undefined;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
type ExerciseQuizProps = {
  lesson: ExerciseLessonPayload;
  initialHearts: number;
  mode?: "PRACTICE" | "PREVIEW";
};

type EvaluationStatus = "correct" | "wrong" | "skipped" | "warning";

type EvaluationResult = {
  status: EvaluationStatus;
  correctAnswerText?: string;
  skippedMessage?: string;
  nextSpeakTries: number;
};

function evaluateExerciseAnswer({
  exercise,
  rawAnswer,
  speakTries,
  mode,
  t,
}: {
  exercise: Exercise;
  rawAnswer: unknown;
  speakTries: number;
  mode: "PRACTICE" | "PREVIEW";
  t: Translations;
}): EvaluationResult {
  if (rawAnswer === "__SKIPPED__") {
    return {
      status: "skipped",
      nextSpeakTries: 0,
    };
  }

  if (rawAnswer === "__NO_STT__") {
    return {
      status: "skipped",
      skippedMessage: t.voiceUnavailable,
      nextSpeakTries: 0,
    };
  }

  const answerData = exercise.answer_data || {};
  let isCorrect = false;

  if (exercise.type === "COMPLETE_CONVERSATION") {
    isCorrect = String(rawAnswer) === String(answerData.correct_option_id || "");
  } else if (exercise.type === "ARRANGE_WORDS") {
    const correct = answerData.correct_sequence || [];
    if (Array.isArray(rawAnswer)) {
      isCorrect = JSON.stringify(rawAnswer.map(String)) === JSON.stringify(correct.map(String));
    }
  } else if (exercise.type === "COMPLETE_TRANSLATION") {
    const correct = answerData.correct_words || [];
    if (Array.isArray(rawAnswer)) {
      isCorrect =
        JSON.stringify(rawAnswer.map((w: string) => normalizeText(w))) ===
        JSON.stringify(correct.map((w: string) => normalizeText(w)));
    }
  } else if (exercise.type === "PICTURE_MATCH") {
    isCorrect = String(rawAnswer) === String(answerData.correct_option_id || "");
  } else if (exercise.type === "TYPE_HEAR") {
    const correct = answerData.correct_transcription || "";
    isCorrect = normalizeText(String(rawAnswer)) === normalizeText(correct);
  } else if (exercise.type === "LISTEN_FILL") {
    const correct = answerData.correct_sequence_ids || [];
    if (Array.isArray(rawAnswer)) {
      isCorrect = JSON.stringify(rawAnswer.map(String)) === JSON.stringify(correct.map(String));
    }
  } else if (exercise.type === "SPEAK_SENTENCE") {
    const expected = answerData.expected_text || "";
    const expectedWords = normalizeText(expected)
      .split(" ")
      .filter((w) => w.length > 0);
    const spokenWords = normalizeText(String(rawAnswer))
      .split(" ")
      .filter((w) => w.length > 0);
    const matchedWordsCount = expectedWords.filter((w) => spokenWords.includes(w)).length;
    isCorrect = matchedWordsCount >= Math.ceil(expectedWords.length / 2);
  }

  if (isCorrect) {
    return {
      status: "correct",
      nextSpeakTries: 0,
    };
  }

  if (exercise.type === "SPEAK_SENTENCE" && mode === "PRACTICE") {
    const newTries = speakTries + 1;
    if (newTries < 3) {
      return {
        status: "warning",
        skippedMessage: t.hmmTryAgain,
        nextSpeakTries: newTries,
      };
    }

    return {
      status: "wrong",
      skippedMessage: t.letsMove,
      nextSpeakTries: 0,
    };
  }

  return {
    status: "wrong",
    correctAnswerText: getCorrectAnswerString(exercise, answerData),
    nextSpeakTries: 0,
  };
}

export const normalizeText = (text: string) => {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s\']/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ExerciseQuiz({
  lesson,
  initialHearts,
  mode = "PRACTICE",
}: ExerciseQuizProps) {
  const router = useRouter();
  const { width, height } = useWindowSize();
  const [pending, startTransition] = useTransition();
  const { isListeningIgnored, isSpeakingIgnored, ignoreListeningFor15Min, ignoreSpeakingFor15Min } = usePreferences();
  const { t } = useLocale();

  // Lesson clock
  const [startedAt] = useState(() => new Date().toISOString());

  // Progress state
  const [hearts, setHearts] = useState(initialHearts);
  const [activeIndex, setActiveIndex] = useState(0);

  // Default true, unless they fail online evaluation
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [questionStart, setQuestionStart] = useState(() => Date.now());

  // We maintain a dynamic queue of exercises (to re-add wrong ones)
  const [dynamicQueue, setDynamicQueue] = useState<Exercise[]>(lesson.exercises as Exercise[]);

  // Per-question feedback
  const [feedbackStatus, setFeedbackStatus] = useState<"none" | "correct" | "wrong" | "skipped" | "warning">("none");
  const [currentRawAnswer, setCurrentRawAnswer] = useState<unknown>(undefined);
  const [correctAnswerText, setCorrectAnswerText] = useState<string | undefined>();
  const [skippedMessage, setSkippedMessage] = useState<string | undefined>();
  const [speakTries, setSpeakTries] = useState(0);

  // Lesson finished
  const [finished, setFinished] = useState(false);
  const [progressResult, setProgressResult] = useState<ProgressResponse | null>(null);

  const extraExercises = dynamicQueue.length - lesson.exercises.length;
  const percentage = Math.min(100, Math.round(((activeIndex - extraExercises) / lesson.exercises.length) * 100));
  const currentExercise = dynamicQueue[activeIndex];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize un-ignored queue on mount to prevent flashing
  useEffect(() => {
    if (mounted && activeIndex === 0 && answers.length === 0) {
      const filtered = lesson.exercises.filter((ex) => {
        const needsListen = ex.type === "TYPE_HEAR" || ex.type === "LISTEN_FILL";
        const needsSpeak = ex.type === "SPEAK_SENTENCE";
        if (needsListen && isListeningIgnored()) return false;
        if (needsSpeak && isSpeakingIgnored()) return false;
        return true;
      });
      if (filtered.length < lesson.exercises.length) {
        setDynamicQueue(filtered as Exercise[]);
        // If entirely empty because all were disabled
        if (filtered.length === 0) {
          submitLesson([]);
          setFinished(true);
        }
      }
    }
  }, [mounted, isListeningIgnored, isSpeakingIgnored, lesson.exercises]);

  // Handle explicitly clicking the "skip" inline button
  function handleIgnore() {
    if (!currentExercise) return;
    const type = currentExercise.type;
    const needsListen = type === "TYPE_HEAR" || type === "LISTEN_FILL";
    const needsSpeak = type === "SPEAK_SENTENCE";

    if (needsListen) {
      ignoreListeningFor15Min();
      setDynamicQueue(prev => prev.filter((ex, i) => i <= activeIndex || (ex.type !== "TYPE_HEAR" && ex.type !== "LISTEN_FILL")));
      setSkippedMessage(t.listeningDisabled);
      handleAnswer("__SKIPPED__");
    } else if (needsSpeak) {
      ignoreSpeakingFor15Min();
      setDynamicQueue(prev => prev.filter((ex, i) => i <= activeIndex || ex.type !== "SPEAK_SENTENCE"));
      setSkippedMessage(t.speakingDisabled);
      handleAnswer("__SKIPPED__");
    }
  }

  // ── Answer received from ExerciseEngine sub-component ──────────────────
  const handleAnswer = async (rawAnswer: unknown) => {
    // Only block if already correct or skipped (allow 'warning' to be re-evaluated)
    if (feedbackStatus === "correct" || feedbackStatus === "skipped" || feedbackStatus === "wrong") return;
    setCurrentRawAnswer(rawAnswer);

    try {
      const evaluation = evaluateExerciseAnswer({
        exercise: currentExercise,
        rawAnswer,
        speakTries,
        mode,
        t,
      });

      setSpeakTries(evaluation.nextSpeakTries);
      setSkippedMessage(evaluation.skippedMessage);
      setCorrectAnswerText(
        evaluation.status === "wrong" ? evaluation.correctAnswerText : undefined
      );
      setFeedbackStatus(evaluation.status);
    } catch {
      toast.error(t.validationFailed);
      setCurrentRawAnswer(undefined);
    }
  };

  // ── Footer "Check / Next / Retry" ──────────────────────────────────────
  const handleContinue = () => {
    if (feedbackStatus === "none") return;

    // If we are in a warning state (retry loop), reset feedback to allow re-input
    if (feedbackStatus === "warning") {
      setFeedbackStatus("none");
      setCurrentRawAnswer(undefined);
      setSkippedMessage(undefined);
      return;
    }

    const isSkipped = feedbackStatus === "skipped";
    const currentDetail: AnswerDetail | null = !isSkipped
      ? {
          exercise_id: currentExercise.id,
          user_answer:
            typeof currentRawAnswer === "string"
              ? currentRawAnswer
              : JSON.stringify(currentRawAnswer),
          is_correct: feedbackStatus === "correct",
          time_spent_ms: Date.now() - questionStart,
        }
      : null;

    const updatedAnswers = currentDetail ? [...answers, currentDetail] : answers;
    setAnswers(updatedAnswers);

    let nextQueue = dynamicQueue;
    if (mode === "PRACTICE" && feedbackStatus === "wrong") {
      nextQueue = [...dynamicQueue, currentExercise];
      setDynamicQueue(nextQueue);
    }

    const nextIndex = activeIndex + 1;

    if (nextIndex >= nextQueue.length) {
      if (mode === "PRACTICE") {
        submitLesson(updatedAnswers);
      }
      setFinished(true);
      return;
    }

    setActiveIndex(nextIndex);
    setFeedbackStatus("none");
    setCurrentRawAnswer(undefined);
    setSkippedMessage(undefined);
    setQuestionStart(Date.now());
  };

  // ── Final submission (Spec §6.4 — single POST after all exercises) ──────
  const submitLesson = (finalAnswers: AnswerDetail[]) => {
    startTransition(async () => {
      try {
        const correct = finalAnswers.filter((a) => a.is_correct).length;
        const score = finalAnswers.length
          ? Math.round((correct / finalAnswers.length) * 100)
          : 0;

        const payload: LessonSubmission = {
          answers: finalAnswers,
          score,
          hearts_left: hearts,
          started_at: startedAt,
          finished_at: new Date().toISOString(),
        };

        const result = await api<ProgressResponse>(
          `/api/v1/lessons/${lesson.id}/submit`,
          { method: "POST", body: JSON.stringify(payload) }
        );
        setProgressResult(result);
      } catch {
        toast.error(t.failedToSaveProgressRetry);
      }
    });
  };

  // ── Empty lesson (No exercises assigned) ─────────────────────────────────
  if (lesson.exercises.length === 0) {
    return (
      <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-y-6 text-center px-4 py-10">
        <Image src="/finish.svg" alt="Empty" height={100} width={100} className="grayscale" />
        <h1 className="text-2xl font-bold text-neutral-700 lg:text-3xl">
          {t.lessonEmptyTitle}
        </h1>
        <p className="text-neutral-500 text-lg">
          {t.lessonEmptyDesc}
        </p>
        <button
          onClick={() => router.push("/learn")}
          className="mt-4 w-full rounded-xl border-b-4 border-green-600 bg-green-500 py-3 font-bold text-white transition hover:bg-green-400"
        >
          {t.returnToLearn}
        </button>
      </div>
    );
  }

  // ── Lesson complete screen ───────────────────────────────────────────────
  if (finished) {
    const correct = answers.filter((a) => a.is_correct).length;
    const score = answers.length ? Math.round((correct / answers.length) * 100) : 0;

    return (
      <>
        <Confetti
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10_000}
          width={width}
          height={height}
        />
        <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-y-6 text-center px-4 py-10">
          <Image src="/finish.svg" alt="Finish" height={100} width={100} />
          <h1 className="text-2xl font-bold text-neutral-700 lg:text-3xl">
            {t.greatJob} <br /> {t.lessonComplete}
          </h1>

          {/* Score */}
          <div className="flex w-full items-center justify-center gap-x-6">
            <div className="flex flex-col items-center rounded-xl border-2 border-yellow-400 bg-yellow-50 px-6 py-3">
              <span className="text-2xl font-bold text-yellow-500">{score}</span>
              <span className="text-xs font-semibold uppercase text-yellow-400">{t.score}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border-2 border-rose-400 bg-rose-50 px-6 py-3">
              <span className="text-2xl font-bold text-rose-500">{hearts}</span>
              <span className="text-xs font-semibold uppercase text-rose-400">{t.hearts}</span>
            </div>
            {progressResult && (
              <div className="flex flex-col items-center rounded-xl border-2 border-green-400 bg-green-50 px-6 py-3">
                <span className="text-2xl font-bold text-green-500">+{progressResult.xp_earned}</span>
                <span className="text-xs font-semibold uppercase text-green-400">XP</span>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/learn")}
            className="w-full rounded-xl border-b-4 border-green-600 bg-green-500 py-3 font-bold text-white transition hover:bg-green-400"
          >
            {t.continue}
          </button>
        </div>
      </>
    );
  }

  // ── Exercise screen ──────────────────────────────────────────────────────
  const getInstructionText = () => {
    if (!currentExercise) return t.completeExercise;
    const type = currentExercise.type;
    const qData = currentExercise.question_data as any;

    switch (type) {
      case "COMPLETE_CONVERSATION": return t.selectCorrectResponse;
      case "ARRANGE_WORDS": return t.formCorrectSentence;
      case "COMPLETE_TRANSLATION": return t.translateSentence;
      case "PICTURE_MATCH": return t.whichIs(qData.word || "word");
      case "TYPE_HEAR": return t.typeWhatYouHear;
      case "LISTEN_FILL": return t.listenSelectWords;
      case "SPEAK_SENTENCE": return t.speakSentence;
      default: return t.completeExercise;
    }
  };

  // Determine Ignore button props for Footer
  let ignoreLabel: string | undefined = undefined;
  let onIgnore: (() => void) | undefined = undefined;

  if (mounted) {
    if (!isListeningIgnored() && (currentExercise?.type === "TYPE_HEAR" || currentExercise?.type === "LISTEN_FILL")) {
      ignoreLabel = t.cantListenNow;
      onIgnore = handleIgnore;
    } else if (!isSpeakingIgnored() && currentExercise?.type === "SPEAK_SENTENCE") {
      ignoreLabel = t.cantSpeakNow;
      onIgnore = handleIgnore;
    }
  }

  return (
    <>
      <Header hearts={hearts} percentage={percentage} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full max-w-[600px] flex-col gap-y-8 px-6 py-10 lg:px-0">

          {/* Exercise title */}
          <h1 className="text-center text-lg font-bold text-neutral-700 lg:text-start lg:text-3xl">
            {getInstructionText()}
          </h1>

          {/* Exercise engine */}
          <div>
            <ExerciseEngine
              key={`${currentExercise.id}-${activeIndex}`} // remount on exercise attempt change
              exercise={currentExercise}
              mode={mode === "PREVIEW" ? "PREVIEW" : "PRACTICE"}
              disabled={feedbackStatus !== "none"}
              onComplete={handleAnswer}
            />
          </div>
        </div>
      </div>

      <Footer
        disabled={feedbackStatus === "none" || pending}
        status={feedbackStatus}
        onCheck={handleContinue}
        correctAnswerText={correctAnswerText}
        onIgnore={onIgnore}
        ignoreLabel={ignoreLabel}
        skippedMessage={skippedMessage}
        isPreview={mode === "PREVIEW"}
      />
    </>
  );
}
