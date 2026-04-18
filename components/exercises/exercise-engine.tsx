"use client";

import type {
  Exercise,
  ExerciseType,
  CompleteConversationData,
  ArrangeWordsData,
  CompleteTranslationData,
  PictureMatchData,
  TypeHearData,
  ListenFillData,
  SpeakSentenceData,
} from "@/types/api";

import { CompleteConversation } from "@/components/exercises/complete-conversation";
import { ArrangeWords } from "@/components/exercises/arrange-words";
import { CompleteTranslation } from "@/components/exercises/complete-translation";
import { PictureMatch } from "@/components/exercises/picture-match";
import { TypeHear } from "@/components/exercises/type-hear";
import { ListenFill } from "@/components/exercises/listen-fill";
import { SpeakSentence } from "@/components/exercises/speak-sentence";

type Mode = "PRACTICE" | "ADMIN_PREVIEW";

type ExerciseEngineProps = {
  exercise: Exercise;
  mode?: Mode;
  disabled?: boolean;
  /** Called once the user submits an answer. Payload is raw answer value. */
  onComplete: (rawAnswer: unknown) => void;
};

/**
 * Polymorphic exercise engine.
 * Routes the exercise `type` to the correct sub-component.
 * Keeps zero evaluation logic here — that stays in the quiz orchestrator.
 */
export function ExerciseEngine({
  exercise,
  mode = "PRACTICE",
  disabled = false,
  onComplete,
}: ExerciseEngineProps) {
  const { id, type, question_data } = exercise;

  const commonProps = {
    disabled: disabled || mode === "ADMIN_PREVIEW",
    onAnswer: onComplete,
  };

  switch (type as ExerciseType) {
    case "COMPLETE_CONVERSATION":
      return (
        <CompleteConversation
          data={question_data as CompleteConversationData}
          {...commonProps}
        />
      );

    case "ARRANGE_WORDS":
      return (
        <ArrangeWords
          data={question_data as ArrangeWordsData}
          {...commonProps}
        />
      );

    case "COMPLETE_TRANSLATION":
      return (
        <CompleteTranslation
          data={question_data as CompleteTranslationData}
          {...commonProps}
        />
      );

    case "PICTURE_MATCH":
      return (
        <PictureMatch
          data={question_data as PictureMatchData}
          {...commonProps}
        />
      );

    case "TYPE_HEAR":
      return (
        <TypeHear
          exerciseId={id}
          data={question_data as TypeHearData}
          {...commonProps}
        />
      );

    case "LISTEN_FILL":
      return (
        <ListenFill
          exerciseId={id}
          data={question_data as ListenFillData}
          {...commonProps}
        />
      );

    case "SPEAK_SENTENCE":
      return (
        <SpeakSentence
          exercise={exercise}
          {...commonProps}
        />
      );

    default:
      return (
        <p className="text-center text-sm text-muted-foreground">
          Unknown exercise type: {type}
        </p>
      );
  }
}
