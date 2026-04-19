"use client";

/**
 * ContentExplorer – file-explorer style view for the 1-N content hierarchy:
 *   Course ─▶ Unit ─▶ Lesson ─▶ Exercise
 *
 * Each level is expandable/collapsible.
 * Create and Edit actions open inline MUI dialogs backed by react-admin
 * CreateBase / EditBase, so the data provider handles all persistence.
 */

import { createContext, useContext, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import {
  Button,
  CreateBase,
  EditBase,
  Form,
  NumberInput,
  SaveButton,
  SelectInput,
  TextInput,
  Toolbar,
  required,
  useGetList,
  useNotify,
  useRefresh,
} from "react-admin";
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  alpha,
  styled,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import SchoolIcon from "@mui/icons-material/School";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { ExerciseEngine } from "@/components/exercises/exercise-engine";
import { adminFetch } from "@/lib/admin-api";
import type { AdminCourse, AdminExercise, AdminExerciseType, AdminLesson, AdminUnit, MistakeAnalyticsItem } from "@/types/api";
import { CEFR_CHOICES, ExerciseDynamicFields, ExerciseSelectAndFields } from "@/components/admin/resources/exercise-fields";

// ---------------------------------------------------------------------------
// Dialog state – discriminated union per resource / action
// ---------------------------------------------------------------------------

type DialogState =
  | { kind: "create-course" }
  | { kind: "edit-course"; id: string; record: AdminCourse }
  | { kind: "create-unit"; course_id: string }
  | { kind: "edit-unit"; id: string; record: AdminUnit }
  | { kind: "create-lesson"; unit_id: string }
  | { kind: "edit-lesson"; id: string; record: AdminLesson }
  | { kind: "create-exercise"; lesson_id: string }
  | { kind: "edit-exercise"; id: string; record: AdminExercise }
  | null;

// ---------------------------------------------------------------------------
// Context – avoids prop-drilling openDialog down the tree
// ---------------------------------------------------------------------------

const ExplorerCtx = createContext<{ openDialog: (s: Exclude<DialogState, null>) => void }>({
  openDialog: () => {},
});

// ---------------------------------------------------------------------------
// Styled tree row
// ---------------------------------------------------------------------------

const TreeRow = styled(ListItem)(({ theme }) => ({
  paddingTop: 2,
  paddingBottom: 2,
  borderRadius: theme.shape.borderRadius,
  "& .row-actions": { visibility: "hidden" },
  "&:hover .row-actions": { visibility: "visible" },
  "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.06) },
}));

// ---------------------------------------------------------------------------
// Exercise node (leaf)
// ---------------------------------------------------------------------------

function ExerciseNode({ exercise, typeName }: { exercise: AdminExercise; typeName: string }) {
  const { openDialog } = useContext(ExplorerCtx);
  return (
    <TreeRow sx={{ pl: 14 }} disablePadding={false}>
      <ListItemIcon sx={{ minWidth: 28 }}>
        <InsertDriveFileIcon sx={{ fontSize: 16, color: "text.secondary" }} />
      </ListItemIcon>
      <ListItemText
        primary={
          <Chip label={typeName} size="small" variant="outlined" sx={{ fontSize: 11 }} />
        }
        sx={{ my: 0 }}
      />
      <Box className="row-actions" sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="Edit exercise">
          <IconButton
            size="small"
            onClick={() =>
              openDialog({ kind: "edit-exercise", id: exercise.id, record: exercise })
            }
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </TreeRow>
  );
}

// ---------------------------------------------------------------------------
// Exercise list (inside a lesson)
// ---------------------------------------------------------------------------

function ExerciseTreeList({ lessonId }: { lessonId: string }) {
  const { data: exerciseTypes = [] } = useGetList<AdminExerciseType>("exercise-types", {
    pagination: { page: 1, perPage: 100 },
  });
  const { data: exercises, isLoading } = useGetList<AdminExercise>("exercises", {
    filter: { lesson_id: lessonId },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "id", order: "ASC" },
  });

  if (isLoading) return <CircularProgress size={14} sx={{ ml: 14, my: 0.5 }} />;

  const typeMap = Object.fromEntries(exerciseTypes.map((t) => [t.id, t.name]));

  return (
    <List disablePadding>
      {exercises?.map((ex) => (
        <ExerciseNode key={ex.id} exercise={ex} typeName={typeMap[ex.exercise_type_id] ?? "?"} />
      ))}
      {!exercises?.length && (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 14, display: "block" }}>
          No exercises
        </Typography>
      )}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Lesson node
// ---------------------------------------------------------------------------

function LessonNode({ lesson }: { lesson: AdminLesson }) {
  const { openDialog } = useContext(ExplorerCtx);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TreeRow sx={{ pl: 9 }} disablePadding={false}>
        <IconButton size="small" onClick={() => setExpanded((v) => !v)} sx={{ mr: 0.5 }}>
          {expanded ? (
            <ExpandLessIcon sx={{ fontSize: 16 }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
        <ListItemIcon sx={{ minWidth: 28 }}>
          {expanded ? (
            <FolderOpenIcon sx={{ fontSize: 18, color: "warning.main" }} />
          ) : (
            <FolderIcon sx={{ fontSize: 18, color: "warning.light" }} />
          )}
        </ListItemIcon>
        <ListItemText
          primary={lesson.title}
          secondary={`Order: ${lesson.order_index}`}
          primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
          secondaryTypographyProps={{ variant: "caption" }}
          sx={{ my: 0 }}
        />
        <Box className="row-actions" sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit lesson">
            <IconButton
              size="small"
              onClick={() =>
                openDialog({ kind: "edit-lesson", id: lesson.id, record: lesson })
              }
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add exercise">
            <IconButton
              size="small"
              onClick={() => openDialog({ kind: "create-exercise", lesson_id: lesson.id })}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </TreeRow>
      <Collapse in={expanded} unmountOnExit>
        <ExerciseTreeList lessonId={lesson.id} />
      </Collapse>
    </>
  );
}

// ---------------------------------------------------------------------------
// Lesson list (inside a unit)
// ---------------------------------------------------------------------------

function LessonTreeList({ unitId }: { unitId: string }) {
  const { data: lessons, isLoading } = useGetList<AdminLesson>("lessons", {
    filter: { unit_id: unitId },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "order_index", order: "ASC" },
  });

  if (isLoading) return <CircularProgress size={14} sx={{ ml: 9, my: 0.5 }} />;

  return (
    <List disablePadding>
      {lessons?.map((l) => <LessonNode key={l.id} lesson={l} />)}
      {!lessons?.length && (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 9, display: "block" }}>
          No lessons
        </Typography>
      )}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Unit node
// ---------------------------------------------------------------------------

function UnitNode({ unit }: { unit: AdminUnit }) {
  const { openDialog } = useContext(ExplorerCtx);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TreeRow sx={{ pl: 5 }} disablePadding={false}>
        <IconButton size="small" onClick={() => setExpanded((v) => !v)} sx={{ mr: 0.5 }}>
          {expanded ? (
            <ExpandLessIcon sx={{ fontSize: 16 }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
        <ListItemIcon sx={{ minWidth: 28 }}>
          {expanded ? (
            <FolderOpenIcon sx={{ fontSize: 18, color: "info.main" }} />
          ) : (
            <FolderIcon sx={{ fontSize: 18, color: "info.light" }} />
          )}
        </ListItemIcon>
        <ListItemText
          primary={unit.title}
          secondary={`Order: ${unit.order_index}`}
          primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
          secondaryTypographyProps={{ variant: "caption" }}
          sx={{ my: 0 }}
        />
        <Box className="row-actions" sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit unit">
            <IconButton
              size="small"
              onClick={() => openDialog({ kind: "edit-unit", id: unit.id, record: unit })}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add lesson">
            <IconButton
              size="small"
              onClick={() => openDialog({ kind: "create-lesson", unit_id: unit.id })}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </TreeRow>
      <Collapse in={expanded} unmountOnExit>
        <LessonTreeList unitId={unit.id} />
      </Collapse>
    </>
  );
}

// ---------------------------------------------------------------------------
// Unit list (inside a course)
// ---------------------------------------------------------------------------

function UnitTreeList({ courseId }: { courseId: string }) {
  const { data: units, isLoading } = useGetList<AdminUnit>("units", {
    filter: { course_id: courseId },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "order_index", order: "ASC" },
  });

  if (isLoading) return <CircularProgress size={14} sx={{ ml: 5, my: 0.5 }} />;

  return (
    <List disablePadding>
      {units?.map((u) => <UnitNode key={u.id} unit={u} />)}
      {!units?.length && (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 5, display: "block" }}>
          No units
        </Typography>
      )}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Course node (top-level folder)
// ---------------------------------------------------------------------------

function CourseNode({ course }: { course: AdminCourse }) {
  const { openDialog } = useContext(ExplorerCtx);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TreeRow sx={{ pl: 1 }} disablePadding={false}>
        <IconButton size="small" onClick={() => setExpanded((v) => !v)} sx={{ mr: 0.5 }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
        <ListItemIcon sx={{ minWidth: 32 }}>
          {expanded ? (
            <FolderOpenIcon color="primary" />
          ) : (
            <FolderIcon color="primary" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={course.title}
          secondary={`CEFR: ${course.expected_cefr_level}`}
          primaryTypographyProps={{ fontWeight: 600 }}
          secondaryTypographyProps={{ variant: "caption" }}
          sx={{ my: 0 }}
        />
        <Box className="row-actions" sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit course">
            <IconButton
              size="small"
              onClick={() =>
                openDialog({ kind: "edit-course", id: course.id, record: course })
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add unit">
            <IconButton
              size="small"
              onClick={() => openDialog({ kind: "create-unit", course_id: course.id })}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TreeRow>
      <Collapse in={expanded} unmountOnExit>
        <UnitTreeList courseId={course.id} />
      </Collapse>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exercise preview button (must be inside a react-admin <Form> context)
// ---------------------------------------------------------------------------

function InlinePreviewButton({ exerciseTypes }: { exerciseTypes: AdminExerciseType[] }) {
  const [open, setOpen] = useState(false);
  const exerciseTypeId = useWatch({ name: "exercise_type_id" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questionData = useWatch({ name: "question_data" }) as Record<string, any> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const answerData = useWatch({ name: "answer_data" }) as Record<string, any>;
  const lessonId = useWatch({ name: "lesson_id" }) as string;

  const typeName = useMemo(
    () => exerciseTypes.find((t) => t.id === exerciseTypeId)?.name ?? "",
    [exerciseTypeId, exerciseTypes]
  );

  const preview = {
    id: "preview",
    lesson_id: lessonId ?? "",
    type: typeName,
    question_data: questionData ?? null,
    answer_data: answerData ?? {},
  };

  return (
    <>
      <Button
        label="Preview"
        onClick={() => setOpen(true)}
        startIcon={<VisibilityIcon />}
        variant="outlined"
        sx={{ ml: 1 }}
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Exercise Preview</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 1 }}>
            <Chip label={typeName || "—"} size="small" color="primary" sx={{ mb: 2 }} />
            {typeName ? (
              <ExerciseEngine
                exercise={preview as Parameters<typeof ExerciseEngine>[0]["exercise"]}
                mode="ADMIN_PREVIEW"
                onComplete={() => {}}
              />
            ) : (
              <Typography color="text.secondary">Select an exercise type first.</Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Mistake analytics section for exercise edit dialogs
// ---------------------------------------------------------------------------

function MistakesSection({ exerciseId }: { exerciseId: string }) {
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mistakes, setMistakes] = useState<MistakeAnalyticsItem[]>([]);

  const handleOpen = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const data = await adminFetch<MistakeAnalyticsItem[]>(
        `/api/v1/admin/exercises/${exerciseId}/logs`
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
        label="View Common Mistakes"
        onClick={handleOpen}
        startIcon={<BarChartIcon />}
        variant="outlined"
        color="warning"
        sx={{ ml: 1 }}
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
// Per-resource form fields
// ---------------------------------------------------------------------------

const CourseFields = () => (
  <>
    <TextInput source="title" fullWidth validate={[required()]} />
    <SelectInput
      source="expected_cefr_level"
      label="CEFR Level"
      choices={CEFR_CHOICES}
      validate={[required()]}
    />
  </>
);

const UnitFields = () => (
  <>
    <TextInput source="title" fullWidth validate={[required()]} />
    <NumberInput source="order_index" label="Order Index" min={0} validate={[required()]} />
  </>
);

const LessonFields = () => (
  <>
    <TextInput source="title" fullWidth validate={[required()]} />
    <TextInput
      source="lesson_form_id"
      label="Lesson Form ID (UUID)"
      fullWidth
      validate={[required()]}
    />
    <NumberInput source="order_index" label="Order Index" min={0} validate={[required()]} />
  </>
);

function ExerciseFields({
  exerciseTypes,
  exerciseId,
}: {
  exerciseTypes: AdminExerciseType[];
  exerciseId?: string;
}) {
  return (
    <>
      <ExerciseSelectAndFields exerciseTypes={exerciseTypes} />
      <Toolbar sx={{ backgroundColor: "transparent", mt: 1, px: 0, minHeight: 0, gap: 1 }}>
        <SaveButton />
        <InlinePreviewButton exerciseTypes={exerciseTypes} />
        {exerciseId && <MistakesSection exerciseId={exerciseId} />}
      </Toolbar>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exercise fields with type loader
// ---------------------------------------------------------------------------

function ExerciseFieldsWithLoader({ exerciseId }: { exerciseId?: string }) {
  const { data: exerciseTypes = [], isLoading } = useGetList<AdminExerciseType>("exercise-types", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  return <ExerciseFields exerciseTypes={exerciseTypes} exerciseId={exerciseId} />;
}

// ---------------------------------------------------------------------------
// Dialog form content (switches on dialog.kind)
// ---------------------------------------------------------------------------

type FormFieldsProps = {
  dialog: Exclude<DialogState, null>;
};

function FormFields({ dialog }: FormFieldsProps) {
  switch (dialog.kind) {
    case "create-course":
    case "edit-course":
      return <CourseFields />;
    case "create-unit":
    case "edit-unit":
      return <UnitFields />;
    case "create-lesson":
    case "edit-lesson":
      return <LessonFields />;
    case "create-exercise":
      return <ExerciseFieldsWithLoader />;
    case "edit-exercise":
      return <ExerciseFieldsWithLoader exerciseId={dialog.id} />;
  }
}

// ---------------------------------------------------------------------------
// Content dialog
// ---------------------------------------------------------------------------

/** Maps each dialog kind to the correct plural resource name and display label. */
const DIALOG_META: Record<string, { resource: string; label: string }> = {
  "create-course":   { resource: "courses",   label: "Course" },
  "edit-course":     { resource: "courses",   label: "Course" },
  "create-unit":     { resource: "units",     label: "Unit" },
  "edit-unit":       { resource: "units",     label: "Unit" },
  "create-lesson":   { resource: "lessons",   label: "Lesson" },
  "edit-lesson":     { resource: "lessons",   label: "Lesson" },
  "create-exercise": { resource: "exercises", label: "Exercise" },
  "edit-exercise":   { resource: "exercises", label: "Exercise" },
};

function ContentDialog({
  dialog,
  onClose,
}: {
  dialog: DialogState;
  onClose: () => void;
}) {
  const refresh = useRefresh();

  if (!dialog) return null;

  const { resource, label } = DIALOG_META[dialog.kind] ?? { resource: dialog.kind, label: dialog.kind };
  const isCreate = dialog.kind.startsWith("create-");
  const title = `${isCreate ? "Create" : "Edit"} ${label}`;

  // Build default record for creates (pre-fill parent IDs)
  const defaults: Record<string, unknown> = {};
  if (dialog.kind === "create-unit") defaults.course_id = dialog.course_id;
  if (dialog.kind === "create-lesson") defaults.unit_id = dialog.unit_id;
  if (dialog.kind === "create-exercise") defaults.lesson_id = dialog.lesson_id;

  const mutationOptions = {
    onSuccess: () => {
      onClose();
      refresh();
    },
  };

  // Non-exercise resources use a simple Save button toolbar.
  // Exercises render their own Toolbar inside ExerciseFields.
  const simpleToolbar =
    resource !== "exercises" ? (
      <Toolbar sx={{ backgroundColor: "transparent", mt: 1, px: 0, minHeight: 0 }}>
        <SaveButton />
      </Toolbar>
    ) : null;

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {isCreate ? (
          <CreateBase
            resource={resource}
            record={defaults}
            redirect={false}
            mutationOptions={mutationOptions}
          >
            <Form>
              <FormFields dialog={dialog} />
              {simpleToolbar}
            </Form>
          </CreateBase>
        ) : (
          <EditBase
            resource={resource}
            id={"id" in dialog ? dialog.id : ""}
            mutationMode="pessimistic"
            redirect={false}
            mutationOptions={mutationOptions}
          >
            <Form>
              <FormFields dialog={dialog} />
              {simpleToolbar}
            </Form>
          </EditBase>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Top-level course list
// ---------------------------------------------------------------------------

function CourseTreeList() {
  const { data: courses, isLoading } = useGetList<AdminCourse>("courses", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "title", order: "ASC" },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!courses?.length) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        No courses yet. Click <strong>+ Add Course</strong> above to get started.
      </Typography>
    );
  }

  return (
    <List disablePadding>
      {courses.map((c) => (
        <CourseNode key={c.id} course={c} />
      ))}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Public page component
// ---------------------------------------------------------------------------

export function ContentExplorer() {
  const [dialog, setDialog] = useState<DialogState>(null);

  return (
    <ExplorerCtx.Provider value={{ openDialog: setDialog }}>
      <Box sx={{ p: 3, maxWidth: 900 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <SchoolIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Content Explorer
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            label="Add Course"
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setDialog({ kind: "create-course" })}
          />
        </Box>

        {/* Legend */}
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          {[
            { color: "primary.main", label: "Course" },
            { color: "info.main", label: "Unit" },
            { color: "warning.main", label: "Lesson" },
            { color: "text.secondary", label: "Exercise" },
          ].map(({ color, label }) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <FolderIcon sx={{ fontSize: 14, color }} />
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary">
            · Hover a row to reveal Edit / Add buttons
          </Typography>
        </Box>

        {/* Tree */}
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
            overflow: "hidden",
          }}
        >
          <CourseTreeList />
        </Box>
      </Box>

      {/* Dialogs */}
      <ContentDialog dialog={dialog} onClose={() => setDialog(null)} />
    </ExplorerCtx.Provider>
  );
}
