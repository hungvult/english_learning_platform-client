"use client";

import { useState, useMemo } from "react";
import { useWatch } from "react-hook-form";
import {
  ArrayInput,
  Create,
  Datagrid,
  Edit,
  EditButton,
  List,
  ReferenceField,
  ReferenceInput,
  SaveButton,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  Toolbar,
  required,
  useGetList,
  useNotify,
  useRecordContext,
  Button,
} from "react-admin";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { ExerciseEngine } from "@/components/exercises/exercise-engine";
import { adminFetch } from "@/lib/admin-api";
import type { AdminExerciseType, MistakeAnalyticsItem } from "@/types/api";

// ---------------------------------------------------------------------------
// Shared toolbar (no delete)
// ---------------------------------------------------------------------------

const SaveOnlyToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

// ---------------------------------------------------------------------------
// Comma-separated string array helpers
// ---------------------------------------------------------------------------

function formatArray(v: string[] | string | undefined): string {
  if (Array.isArray(v)) return v.join(", ");
  return v ?? "";
}

function parseArray(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Dynamic per-type question/answer fields
// ---------------------------------------------------------------------------

type TypeFieldsProps = {
  typeName: string | undefined;
};

function ExerciseTypeFields({ typeName }: TypeFieldsProps) {
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
// Type-aware wrapper (watches exercise_type_id and resolves type name)
// ---------------------------------------------------------------------------

type ExerciseDynamicFieldsProps = {
  exerciseTypes: AdminExerciseType[];
};

function ExerciseDynamicFields({ exerciseTypes }: ExerciseDynamicFieldsProps) {
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
// Exercise preview dialog
// ---------------------------------------------------------------------------

type PreviewDialogProps = {
  open: boolean;
  onClose: () => void;
  exercise: {
    id: string;
    lesson_id: string;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    question_data: Record<string, any> | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answer_data: Record<string, any>;
  };
};

function PreviewDialog({ open, onClose, exercise }: PreviewDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Exercise Preview</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          <Chip label={exercise.type} size="small" color="primary" sx={{ mb: 2 }} />
          {exercise.type ? (
            <ExerciseEngine
              exercise={exercise as Parameters<typeof ExerciseEngine>[0]["exercise"]}
              mode="ADMIN_PREVIEW"
              onComplete={() => {}}
            />
          ) : (
            <Typography color="text.secondary">Select an exercise type first.</Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Preview button (reads current form values)
// ---------------------------------------------------------------------------

type PreviewButtonProps = {
  exerciseTypes: AdminExerciseType[];
};

function ExercisePreviewButton({ exerciseTypes }: PreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const exerciseTypeId = useWatch({ name: "exercise_type_id" });
  const questionData = useWatch({ name: "question_data" });
  const answerData = useWatch({ name: "answer_data" });
  const lessonId = useWatch({ name: "lesson_id" });

  const typeName = useMemo(
    () => exerciseTypes.find((t) => t.id === exerciseTypeId)?.name ?? "",
    [exerciseTypeId, exerciseTypes]
  );

  const previewExercise = {
    id: "preview",
    lesson_id: lessonId ?? "",
    type: typeName,
    question_data: questionData ?? null,
    answer_data: answerData ?? {},
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        label="Preview"
        startIcon={<VisibilityIcon />}
        variant="outlined"
        sx={{ ml: 1 }}
      />
      <PreviewDialog open={open} onClose={() => setOpen(false)} exercise={previewExercise} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Mistakes analytics button (Edit view only)
// ---------------------------------------------------------------------------

function MistakesAnalyticsButton() {
  const record = useRecordContext();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mistakes, setMistakes] = useState<MistakeAnalyticsItem[]>([]);

  if (!record) return null;

  const handleOpen = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const data = await adminFetch<MistakeAnalyticsItem[]>(
        `/api/v1/admin/exercises/${record.id}/logs`
      );
      setMistakes(data);
    } catch {
      notify("Failed to load mistake analytics.", { type: "error" });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        label="View Common Mistakes"
        startIcon={<BarChartIcon />}
        variant="outlined"
        color="warning"
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Common Wrong Answers</DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : mistakes.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No incorrect answers recorded yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Wrong Answer</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Count</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mistakes.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.user_answer}</TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exercise form (shared between Create and Edit)
// ---------------------------------------------------------------------------

type ExerciseFormProps = {
  exerciseTypes: AdminExerciseType[];
  isEdit?: boolean;
};

function ExerciseForm({ exerciseTypes, isEdit }: ExerciseFormProps) {
  const typeChoices = exerciseTypes.map((t) => ({ id: t.id, name: t.name }));

  return (
    <SimpleForm
      toolbar={
        <Toolbar sx={{ gap: 1 }}>
          <SaveButton />
          <ExercisePreviewButton exerciseTypes={exerciseTypes} />
          {isEdit && <MistakesAnalyticsButton />}
        </Toolbar>
      }
    >
      <ReferenceInput source="lesson_id" reference="lessons">
        <SelectInput optionText="title" fullWidth validate={[required()]} />
      </ReferenceInput>
      <SelectInput
        source="exercise_type_id"
        label="Exercise Type"
        choices={typeChoices}
        fullWidth
        validate={[required()]}
      />
      <ExerciseDynamicFields exerciseTypes={exerciseTypes} />
    </SimpleForm>
  );
}

// ---------------------------------------------------------------------------
// Loader wrapper – fetches exercise types once before rendering the form
// ---------------------------------------------------------------------------

function ExerciseFormWithTypes({ isEdit }: { isEdit?: boolean }) {
  const { data: exerciseTypes = [], isLoading } = useGetList<AdminExerciseType>("exercise-types", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return <ExerciseForm exerciseTypes={exerciseTypes} isEdit={isEdit} />;
}

// ---------------------------------------------------------------------------
// Public resource components
// ---------------------------------------------------------------------------

const exerciseFilters = [
  <ReferenceInput key="lesson_id" source="lesson_id" reference="lessons" alwaysOn>
    <SelectInput label="Filter by Lesson" optionText="title" />
  </ReferenceInput>,
];

export const ExerciseList = () => (
  <List filters={exerciseFilters}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="lesson_id" reference="lessons" label="Lesson">
        <TextField source="title" />
      </ReferenceField>
      <ReferenceField source="exercise_type_id" reference="exercise-types" label="Type">
        <TextField source="name" />
      </ReferenceField>
      <EditButton />
    </Datagrid>
  </List>
);

export const ExerciseCreate = () => (
  <Create>
    <ExerciseFormWithTypes />
  </Create>
);

export const ExerciseEdit = () => (
  <Edit>
    <ExerciseFormWithTypes isEdit />
  </Edit>
);
