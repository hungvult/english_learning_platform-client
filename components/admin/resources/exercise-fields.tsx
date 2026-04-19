"use client";

/**
 * Shared exercise type field components.
 * Used by both the standalone Exercise resource pages and the ContentExplorer.
 * Must be rendered inside a react-admin <Form> (provides react-hook-form context).
 */

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import {
  ArrayInput,
  SelectInput,
  SimpleFormIterator,
  TextInput,
  required,
} from "react-admin";
import { Divider, Typography } from "@mui/material";

import type { AdminExerciseType } from "@/types/api";

// ---------------------------------------------------------------------------
// Comma-separated string array helpers
// ---------------------------------------------------------------------------

export function formatArray(v: string[] | string | undefined): string {
  if (Array.isArray(v)) return v.join(", ");
  return v ?? "";
}

export function parseArray(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// CEFR choices (shared between CourseFields and ContentExplorer)
// ---------------------------------------------------------------------------

export const CEFR_CHOICES = [
  { id: "A1", name: "A1" },
  { id: "A2", name: "A2" },
  { id: "B1", name: "B1" },
  { id: "B2", name: "B2" },
  { id: "C1", name: "C1" },
  { id: "C2", name: "C2" },
];

// ---------------------------------------------------------------------------
// Per-type question/answer fields
// ---------------------------------------------------------------------------

type TypeFieldsProps = {
  typeName: string | undefined;
};

export function ExerciseTypeFields({ typeName }: TypeFieldsProps) {
  if (!typeName) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Select an exercise type to see its fields.
      </Typography>
    );
  }

  switch (typeName) {
    case "COMPLETE_CONVERSATION":
      return (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Question Data
          </Typography>
          <TextInput
            source="question_data.text"
            label="Conversation text (shown to user)"
            fullWidth
            multiline
            validate={[required()]}
          />
          <ArrayInput source="question_data.options" label="Options">
            <SimpleFormIterator inline>
              <TextInput source="id" label="Option ID" helperText="e.g. opt1" />
              <TextInput source="text" label="Option text" />
            </SimpleFormIterator>
          </ArrayInput>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Answer Data
          </Typography>
          <TextInput
            source="answer_data.correct_option_id"
            label="Correct option ID"
            fullWidth
            validate={[required()]}
            helperText="Must match one of the option IDs above"
          />
        </>
      );

    case "ARRANGE_WORDS":
      return (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Question Data
          </Typography>
          <TextInput
            source="question_data.tokens"
            label="Word tokens (comma-separated, will be shuffled)"
            fullWidth
            validate={[required()]}
            format={formatArray}
            parse={parseArray}
            helperText="e.g. I, am, happy, today"
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Answer Data
          </Typography>
          <TextInput
            source="answer_data.correct_sequence"
            label="Correct sequence (comma-separated)"
            fullWidth
            validate={[required()]}
            format={formatArray}
            parse={parseArray}
            helperText="e.g. I, am, happy, today"
          />
        </>
      );

    case "COMPLETE_TRANSLATION":
      return (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Question Data
          </Typography>
          <TextInput
            source="question_data.source_sentence"
            label="Source sentence (shown to user)"
            fullWidth
            multiline
            validate={[required()]}
          />
          <TextInput
            source="question_data.text_template"
            label="Text template (use {0}, {1}… for blanks)"
            fullWidth
            validate={[required()]}
            helperText="e.g. My name is {0} and I am {1} years old."
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Answer Data
          </Typography>
          <TextInput
            source="answer_data.correct_words"
            label="Correct words (comma-separated, in blank order)"
            fullWidth
            validate={[required()]}
            format={formatArray}
            parse={parseArray}
            helperText="e.g. John, 25"
          />
        </>
      );

    case "PICTURE_MATCH":
      return (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Question Data
          </Typography>
          <TextInput
            source="question_data.word"
            label="Word or phrase to match"
            fullWidth
            validate={[required()]}
          />
          <ArrayInput source="question_data.options" label="Image options">
            <SimpleFormIterator inline>
              <TextInput source="id" label="Option ID" helperText="e.g. opt1" />
              <TextInput source="text" label="Label text" />
              <TextInput source="image_url" label="Image URL" />
            </SimpleFormIterator>
          </ArrayInput>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Answer Data
          </Typography>
          <TextInput
            source="answer_data.correct_option_id"
            label="Correct option ID"
            fullWidth
            validate={[required()]}
            helperText="Must match one of the option IDs above"
          />
        </>
      );

    case "TYPE_HEAR":
      return (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Answer Data
          </Typography>
          <TextInput
            source="answer_data.correct_transcription"
            label="Correct transcription (also used as TTS audio)"
            fullWidth
            multiline
            validate={[required()]}
          />
        </>
      );

    case "LISTEN_FILL":
      return (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Question Data
          </Typography>
          <TextInput
            source="question_data.text"
            label="Sentence (converted to TTS audio)"
            fullWidth
            multiline
            validate={[required()]}
          />
          <ArrayInput source="question_data.word_bank" label="Word bank">
            <SimpleFormIterator inline>
              <TextInput source="id" label="Word ID" helperText="e.g. w1" />
              <TextInput source="text" label="Word text" />
            </SimpleFormIterator>
          </ArrayInput>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Answer Data
          </Typography>
          <TextInput
            source="answer_data.correct_sequence_ids"
            label="Correct word IDs in order (comma-separated)"
            fullWidth
            validate={[required()]}
            format={formatArray}
            parse={parseArray}
            helperText="e.g. w1, w3, w2"
          />
        </>
      );

    case "SPEAK_SENTENCE":
      return (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Answer Data
          </Typography>
          <TextInput
            source="answer_data.expected_text"
            label="Expected spoken text (used for STT comparison)"
            fullWidth
            multiline
            validate={[required()]}
          />
        </>
      );

    default:
      return (
        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
          Unknown exercise type: {typeName}
        </Typography>
      );
  }
}

// ---------------------------------------------------------------------------
// Type-aware wrapper: watches exercise_type_id, renders ExerciseTypeFields
// ---------------------------------------------------------------------------

export type ExerciseDynamicFieldsProps = {
  exerciseTypes: AdminExerciseType[];
};

export function ExerciseDynamicFields({ exerciseTypes }: ExerciseDynamicFieldsProps) {
  const exerciseTypeId = useWatch({ name: "exercise_type_id" });

  const typeName = useMemo(() => {
    if (!exerciseTypeId || exerciseTypes.length === 0) return undefined;
    return exerciseTypes.find((t) => t.id === exerciseTypeId)?.name;
  }, [exerciseTypeId, exerciseTypes]);

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <ExerciseTypeFields typeName={typeName} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Exercise type select + dynamic fields (used inside a react-admin Form)
// ---------------------------------------------------------------------------

export function ExerciseSelectAndFields({ exerciseTypes }: ExerciseDynamicFieldsProps) {
  const typeChoices = exerciseTypes.map((t) => ({ id: t.id, name: t.name }));
  return (
    <>
      <SelectInput
        source="exercise_type_id"
        label="Exercise Type"
        choices={typeChoices}
        fullWidth
        validate={[required()]}
      />
      <ExerciseDynamicFields exerciseTypes={exerciseTypes} />
    </>
  );
}
