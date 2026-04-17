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
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ExerciseQuiz({ lesson, initialHearts }: ExerciseQuizProps) {
  const router = useRouter();
  const { width, height } = useWindowSize();
  const [pending, startTransition] = useTransition();
  const { isListeningIgnored, isSpeakingIgnored, ignoreListeningFor15Min, ignoreSpeakingFor15Min } = usePreferences();

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
  const [feedbackStatus, setFeedbackStatus] = useState<"none" | "correct" | "wrong" | "skipped">("none");
  const [currentRawAnswer, setCurrentRawAnswer] = useState<unknown>(undefined);
  const [correctAnswerText, setCorrectAnswerText] = useState<string | undefined>();
  const [skippedMessage, setSkippedMessage] = useState<string | undefined>();

  // Lesson finished
  const [finished, setFinished] = useState(false);
  const [progressResult, setProgressResult] = useState<ProgressResponse | null>(null);

  const percentage = Math.round((activeIndex / lesson.exercises.length) * 100);
  const currentExercise = dynamicQueue[activeIndex];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-skip logic for ignored modalities
  useEffect(() => {
    if (!currentExercise || feedbackStatus !== "none" || !mounted) return;
    const type = currentExercise.type;
    const needsListen = type === "TYPE_HEAR" || type === "LISTEN_FILL";
    const needsSpeak = type === "SPEAK_SENTENCE";

    if ((needsListen && isListeningIgnored())) {
      setSkippedMessage("Listening exercises are disabled for 15 minutes.");
      setTimeout(() => handleAnswer("__SKIPPED__"), 50);
    } else if ((needsSpeak && isSpeakingIgnored())) {
      setSkippedMessage("Speaking exercises are disabled for 15 minutes.");
      setTimeout(() => handleAnswer("__SKIPPED__"), 50);
    }
  }, [currentExercise, feedbackStatus, isListeningIgnored, isSpeakingIgnored, mounted]);

  // Determine Ignore button props for Footer
  let ignoreLabel: string | undefined = undefined;
  let onIgnore: (() => void) | undefined = undefined;
  
  if (mounted) {
    if (!isListeningIgnored() && (currentExercise?.type === "TYPE_HEAR" || currentExercise?.type === "LISTEN_FILL")) {
      ignoreLabel = "Can't listen now";
      onIgnore = () => {
        ignoreListeningFor15Min();
        setSkippedMessage("Listening exercises disabled for 15 minutes.");
        handleAnswer("__SKIPPED__");
      };
    } else if (!isSpeakingIgnored() && currentExercise?.type === "SPEAK_SENTENCE") {
      ignoreLabel = "Can't speak now";
      onIgnore = () => {
        ignoreSpeakingFor15Min();
        setSkippedMessage("Speaking exercises disabled for 15 minutes.");
        handleAnswer("__SKIPPED__");
      };
    }
  }

  // ── Answer received from ExerciseEngine sub-component ──────────────────
  const handleAnswer = async (rawAnswer: unknown) => {
    if (feedbackStatus !== "none") return; // already answered this question
    setCurrentRawAnswer(rawAnswer);

    // Offline fallback / explicitly skipped
    if (rawAnswer === "__SKIPPED__" || rawAnswer === "__NO_STT__") {
      if (!skippedMessage && rawAnswer === "__NO_STT__") {
        setSkippedMessage("Voice recognition unavailable.");
      }
      setFeedbackStatus("skipped");
      return;
    }

    try {
      const type = currentExercise.type;
      const answerData = currentExercise.answer_data || {};
      let isCorrect = false;

      if (type === "COMPLETE_CONVERSATION") {
        isCorrect = String(rawAnswer) === String(answerData.correct_option_id || "");
      } else if (type === "ARRANGE_WORDS") {
        const correct = answerData.correct_sequence || [];
        if (Array.isArray(rawAnswer)) {
          isCorrect = JSON.stringify(rawAnswer.map(String)) === JSON.stringify(correct.map(String));
        }
      } else if (type === "COMPLETE_TRANSLATION") {
        const correct = answerData.correct_words || [];
        if (Array.isArray(rawAnswer)) {
          isCorrect = JSON.stringify(rawAnswer.map((w: string) => w.trim().toLowerCase())) === 
                     JSON.stringify(correct.map((w: string) => w.trim().toLowerCase()));
        }
      } else if (type === "PICTURE_MATCH") {
        isCorrect = String(rawAnswer) === String(answerData.correct_option_id || "");
      } else if (type === "TYPE_HEAR") {
        const correct = answerData.correct_transcription || "";
        isCorrect = String(rawAnswer).trim().toLowerCase() === correct.trim().toLowerCase();
      } else if (type === "LISTEN_FILL") {
        const correct = answerData.correct_sequence_ids || [];
        if (Array.isArray(rawAnswer)) {
          isCorrect = JSON.stringify(rawAnswer.map(String)) === JSON.stringify(correct.map(String));
        }
      } else if (type === "SPEAK_SENTENCE") {
        const expected = answerData.expected_text || "";
        isCorrect = String(rawAnswer).trim().toLowerCase() === expected.trim().toLowerCase();
      }

      if (isCorrect) {
        setFeedbackStatus("correct");
      } else {
        const correctStr = getCorrectAnswerString(currentExercise, answerData);
        setCorrectAnswerText(correctStr);
        setFeedbackStatus("wrong");
      }
    } catch {
      toast.error("Validation failed.");
      setCurrentRawAnswer(undefined);
    }
  };

  // ── Footer "Check / Next / Retry" ──────────────────────────────────────
  const handleContinue = () => {
    if (feedbackStatus === "none") return;

    const isSkipped = feedbackStatus === "skipped";

    if (!isSkipped) {
      const detail: AnswerDetail = {
        exercise_id: currentExercise.id,
        user_answer:
          typeof currentRawAnswer === "string"
            ? currentRawAnswer
            : JSON.stringify(currentRawAnswer),
        is_correct: feedbackStatus === "correct",
        time_spent_ms: Date.now() - questionStart,
      };
      setAnswers([...answers, detail]);
    }

    // Instead of retrying immediately, we queue wrong answers to end
    let updatedQueue = dynamicQueue;
    if (feedbackStatus === "wrong") {
      updatedQueue = [...dynamicQueue, currentExercise];
      setDynamicQueue(updatedQueue);
    }

    const nextIndex = activeIndex + 1;

    if (nextIndex >= updatedQueue.length) {
      // All exercises done (queue is fully consumed) — submit and show completion screen
      const finalAnswers = !isSkipped ? [...answers, {
        exercise_id: currentExercise.id,
        user_answer: typeof currentRawAnswer === "string" ? currentRawAnswer : JSON.stringify(currentRawAnswer),
        is_correct: feedbackStatus === "correct",
        time_spent_ms: Date.now() - questionStart,
      }] : answers;
      submitLesson(finalAnswers);
      setFinished(true);
    } else {
      setActiveIndex(nextIndex);
      setFeedbackStatus("none");
      setCurrentRawAnswer(undefined);
      setSkippedMessage(undefined);
      setQuestionStart(Date.now());
    }
  };

  // ── Final submission (Spec §6.4 — single POST after all exercises) ──────
  const submitLesson = (finalAnswers: AnswerDetail[]) => {
    startTransition(async () => {
      try {
        const correct = finalAnswers.filter((a) => a.is_correct).length;
        const score = Math.round((correct / finalAnswers.length) * 100);

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
        toast.error("Failed to save progress. Please retry.");
      }
    });
  };

  // ── Lesson complete screen ───────────────────────────────────────────────
  if (finished) {
    const correct = answers.filter((a) => a.is_correct).length;
    const score = Math.round((correct / answers.length) * 100);

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
            Great job! <br /> You&apos;ve completed the lesson.
          </h1>

          {/* Score */}
          <div className="flex w-full items-center justify-center gap-x-6">
            <div className="flex flex-col items-center rounded-xl border-2 border-yellow-400 bg-yellow-50 px-6 py-3">
              <span className="text-2xl font-bold text-yellow-500">{score}</span>
              <span className="text-xs font-semibold uppercase text-yellow-400">Score</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border-2 border-rose-400 bg-rose-50 px-6 py-3">
              <span className="text-2xl font-bold text-rose-500">{hearts}</span>
              <span className="text-xs font-semibold uppercase text-rose-400">Hearts</span>
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
            Continue
          </button>
        </div>
      </>
    );
  }

  // ── Exercise screen ──────────────────────────────────────────────────────
  const instructionText =
    (currentExercise?.question_data as { instruction?: string })?.instruction ??
    "Complete the exercise";

  return (
    <>
      <Header hearts={hearts} percentage={percentage} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full max-w-[600px] flex-col gap-y-8 px-6 py-10 lg:px-0">
          {/* Exercise index indicator */}
          <p className="text-sm text-muted-foreground text-right">
            {activeIndex + 1} / {dynamicQueue.length}
          </p>

          {/* Exercise title */}
          <h1 className="text-center text-lg font-bold text-neutral-700 lg:text-start lg:text-3xl">
            {instructionText}
          </h1>

          {/* Exercise engine */}
          <div>
            <ExerciseEngine
              key={currentExercise.id} // remount on exercise change
              exercise={currentExercise}
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
      />
    </>
  );
}
