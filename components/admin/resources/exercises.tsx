"use client";

import { useState, useMemo, useEffect } from "react";
import { useWatch } from "react-hook-form";
import {
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
  TextField,
  Toolbar,
  required,
  useGetList,
  useNotify,
  useRecordContext,
  Button,
} from "react-admin";
import {
  Box,
  Button as MuiButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { evaluateExerciseAnswer } from "@/app/lesson/exercise-quiz";
import { translations } from "@/lib/i18n";
import { adminFetch } from "@/lib/admin-api";
import type { AdminExerciseType, Exercise, MistakeAnalyticsItem } from "@/types/api";
import {
  ExerciseDynamicFields,
} from "@/components/admin/resources/exercise-fields";

// ---------------------------------------------------------------------------
// Shared toolbar (no delete)
// ---------------------------------------------------------------------------

const SaveOnlyToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

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
  const [feedbackStatus, setFeedbackStatus] = useState<"none" | "correct" | "wrong">("none");
  const [pendingAnswer, setPendingAnswer] = useState<unknown>(null);
  const [correctAnswerText, setCorrectAnswerText] = useState<string | undefined>();
  const [tryCount, setTryCount] = useState(0);

  // Reset state each time the dialog opens
  useEffect(() => {
    if (open) {
      setFeedbackStatus("none");
      setPendingAnswer(null);
      setCorrectAnswerText(undefined);
      setTryCount(0);
    }
  }, [open]);

  const handleAnswer = (rawAnswer: unknown) => {
    if (feedbackStatus !== "none") return;
    setPendingAnswer(rawAnswer);
  };

  const handleCheck = () => {
    if (pendingAnswer === null) return;
    const result = evaluateExerciseAnswer({
      exercise: exercise as Exercise,
      rawAnswer: pendingAnswer,
      speakTries: 0,
      mode: "PREVIEW",
      t: translations.en,
    });
    if (result.status === "correct") {
      setFeedbackStatus("correct");
      setCorrectAnswerText(undefined);
    } else if (result.status === "wrong" || result.status === "warning") {
      setFeedbackStatus("wrong");
      setCorrectAnswerText(result.correctAnswerText);
    }
    // skipped → leave feedback as "none" (no answer to evaluate)
  };

  const handleReset = () => {
    setFeedbackStatus("none");
    setPendingAnswer(null);
    setCorrectAnswerText(undefined);
    setTryCount((c) => c + 1);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Exercise Preview</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          <Chip label={exercise.type} size="small" color="primary" sx={{ mb: 2 }} />
          {exercise.type ? (
            <ExerciseEngine
              key={`${exercise.type}-${tryCount}`}
              exercise={exercise as Parameters<typeof ExerciseEngine>[0]["exercise"]}
              mode="PREVIEW"
              disabled={feedbackStatus !== "none"}
              onComplete={handleAnswer}
            />
          ) : (
            <Typography color="text.secondary">Select an exercise type first.</Typography>
          )}

          {/* Feedback */}
          {feedbackStatus === "correct" && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 1 }}>
              <Typography sx={{ color: "#16a34a", fontWeight: "bold" }}>✓ Correct!</Typography>
            </Box>
          )}
          {feedbackStatus === "wrong" && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: "#fff1f2", border: "1px solid #fda4af", borderRadius: 1 }}>
              <Typography sx={{ color: "#e11d48", fontWeight: "bold" }}>✗ Incorrect</Typography>
              {correctAnswerText && (
                <Typography sx={{ color: "#e11d48", mt: 0.5 }} variant="body2">
                  Correct answer: <strong>{correctAnswerText}</strong>
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <MuiButton onClick={onClose}>Close</MuiButton>
        {feedbackStatus === "none" ? (
          <MuiButton
            variant="contained"
            onClick={handleCheck}
            disabled={pendingAnswer === null}
          >
            Check Answer
          </MuiButton>
        ) : (
          <MuiButton variant="outlined" onClick={handleReset}>
            Try Again
          </MuiButton>
        )}
      </DialogActions>
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
