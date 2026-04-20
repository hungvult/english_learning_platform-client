"use client";

/**
 * Multi-page drill-down content navigation:
 *
 *   /content/courses                                                     → CoursesPage
 *   /content/courses/:courseId/units                                     → UnitsPage
 *   /content/courses/:courseId/units/:unitId/lessons                     → LessonsPage
 *   /content/courses/:courseId/units/:unitId/lessons/:lessonId/exercises → ExercisesPage
 *
 * Each page shows a breadcrumb, a filtered list, and inline create/edit dialogs.
 * Clicking a row's "→" button navigates into the child page for that record.
 *
 * SERVER REQUIREMENTS
 * The following filter query parameters must be supported by the server API:
 *   GET /api/v1/admin/units?course_id=<id>           — units belonging to a course
 *   GET /api/v1/admin/lessons?unit_id=<id>           — lessons belonging to a unit
 *   GET /api/v1/admin/exercises?lesson_id=<id>       — exercises belonging to a lesson
 */

import { useState, useMemo } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
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
  useGetOne,
  useNotify,
  useRefresh,
} from "react-admin";
import {
  Box,
  Breadcrumbs,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import BarChartIcon from "@mui/icons-material/BarChart";
import EditIcon from "@mui/icons-material/Edit";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SchoolIcon from "@mui/icons-material/School";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { ExerciseEngine } from "@/components/exercises/exercise-engine";
import { adminFetch } from "@/lib/admin-api";
import type {
  AdminCourse,
  AdminExercise,
  AdminExerciseType,
  AdminLesson,
  AdminUnit,
  MistakeAnalyticsItem,
} from "@/types/api";
import { CEFR_CHOICES, ExerciseSelectAndFields } from "@/components/admin/resources/exercise-fields";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DialogState =
  | null
  | { mode: "create"; defaults: Record<string, unknown> }
  | { mode: "edit"; id: string };

type Crumb = { label: string; to?: string };

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

function BreadcrumbNav({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        if (isLast || !c.to) {
          return (
            <Typography
              key={i}
              variant="body2"
              color={isLast ? "text.primary" : "text.secondary"}
              fontWeight={isLast ? 600 : 400}
            >
              {c.label}
            </Typography>
          );
        }
        return (
          <RouterLink key={i} to={c.to} style={{ textDecoration: "none" }}>
            <Typography variant="body2" color="primary.main">
              {c.label}
            </Typography>
          </RouterLink>
        );
      })}
    </Breadcrumbs>
  );
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------

function PageHeader({
  title,
  addLabel,
  onAdd,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
      <SchoolIcon color="primary" />
      <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
        {title}
      </Typography>
      <Button label={addLabel} startIcon={<AddIcon />} variant="contained" onClick={onAdd} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Save-only toolbar (for non-exercise dialogs)
// ---------------------------------------------------------------------------

const SaveOnly = () => (
  <Toolbar sx={{ background: "transparent", mt: 1, px: 0, minHeight: 0 }}>
    <SaveButton />
  </Toolbar>
);

// ---------------------------------------------------------------------------
// Exercise preview button (inside a react-admin Form context)
// ---------------------------------------------------------------------------

function ExercisePreviewButton({ exerciseTypes }: { exerciseTypes: AdminExerciseType[] }) {
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
// Mistake analytics dialog (standalone, outside Form context)
// ---------------------------------------------------------------------------

function MistakesDialog({
  exerciseId,
  open,
  onClose,
  loading,
  mistakes,
}: {
  exerciseId: string;
  open: boolean;
  onClose: () => void;
  loading: boolean;
  mistakes: MistakeAnalyticsItem[];
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Common Wrong Answers — exercise {exerciseId}</DialogTitle>
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
  );
}

function MistakesButton({ exerciseId }: { exerciseId: string }) {
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
      <Tooltip title="View common mistakes">
        <IconButton size="small" color="warning" onClick={handleOpen}>
          <BarChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <MistakesDialog
        exerciseId={exerciseId}
        open={open}
        onClose={() => setOpen(false)}
        loading={loading}
        mistakes={mistakes}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Exercise form content (type select + dynamic fields + toolbar with preview)
// ---------------------------------------------------------------------------

function ExerciseFormContent({
  exerciseTypes,
  exerciseId,
}: {
  exerciseTypes: AdminExerciseType[];
  exerciseId?: string;
}) {
  return (
    <>
      <ExerciseSelectAndFields exerciseTypes={exerciseTypes} />
      <Toolbar sx={{ background: "transparent", mt: 1, px: 0, minHeight: 0, gap: 1 }}>
        <SaveButton />
        <ExercisePreviewButton exerciseTypes={exerciseTypes} />
      </Toolbar>
      {exerciseId && (
        <Box sx={{ mt: 1 }}>
          <MistakesButton exerciseId={exerciseId} />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            View common mistakes for this exercise
          </Typography>
        </Box>
      )}
    </>
  );
}

function ExerciseFormWithLoader({ exerciseId }: { exerciseId?: string }) {
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
  return <ExerciseFormContent exerciseTypes={exerciseTypes} exerciseId={exerciseId} />;
}

// ---------------------------------------------------------------------------
// Generic inline resource dialog (wraps CreateBase / EditBase)
// ---------------------------------------------------------------------------

function ResourceDialog({
  title,
  resource,
  dialog,
  onClose,
  formContent,
}: {
  title: string;
  resource: string;
  dialog: Exclude<DialogState, null>;
  onClose: () => void;
  formContent: React.ReactNode;
}) {
  const refresh = useRefresh();

  const mutationOptions = {
    onSuccess: () => {
      onClose();
      refresh();
    },
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {dialog.mode === "create" ? (
          <CreateBase
            resource={resource}
            record={dialog.defaults}
            redirect={false}
            mutationOptions={mutationOptions}
          >
            <Form>{formContent}</Form>
          </CreateBase>
        ) : (
          <EditBase
            resource={resource}
            id={dialog.id}
            mutationMode="pessimistic"
            redirect={false}
            mutationOptions={mutationOptions}
          >
            <Form>{formContent}</Form>
          </EditBase>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Courses page  (/content/courses)
// ---------------------------------------------------------------------------

function CourseFormContent() {
  return (
    <>
      <TextInput source="title" fullWidth validate={[required()]} />
      <SelectInput
        source="expected_cefr_level"
        label="CEFR Level"
        choices={CEFR_CHOICES}
        validate={[required()]}
      />
      <SaveOnly />
    </>
  );
}

export function CoursesPage() {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: courses, isLoading } = useGetList<AdminCourse>("courses", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "title", order: "ASC" },
  });

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <BreadcrumbNav crumbs={[{ label: "Courses" }]} />
      <PageHeader
        title="Courses"
        addLabel="Add Course"
        onAdd={() => setDialog({ mode: "create", defaults: {} })}
      />

      <Paper variant="outlined">
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Title</strong>
                  </TableCell>
                  <TableCell>
                    <strong>CEFR Level</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!courses?.length ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography color="text.secondary" sx={{ p: 1 }}>
                        No courses yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => (
                    <TableRow
                      key={course.id}
                      hover
                      sx={{ cursor: "default" }}
                    >
                      <TableCell>{course.title}</TableCell>
                      <TableCell>
                        <Chip label={course.expected_cefr_level} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit course">
                          <IconButton
                            size="small"
                            onClick={() => setDialog({ mode: "edit", id: course.id })}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View units">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/content/courses/${course.id}/units`)}
                          >
                            <ArrowForwardIosIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {dialog && (
        <ResourceDialog
          title={dialog.mode === "create" ? "Create Course" : "Edit Course"}
          resource="courses"
          dialog={dialog}
          onClose={() => setDialog(null)}
          formContent={<CourseFormContent />}
        />
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Units page  (/content/courses/:courseId/units)
// ---------------------------------------------------------------------------

function UnitFormContent({ courseId }: { courseId: string }) {
  return (
    <>
      {/* course_id is pre-filled as a default record value — render as read-only */}
      <TextInput source="course_id" label="Course ID" fullWidth disabled />
      <TextInput source="title" fullWidth validate={[required()]} />
      <NumberInput source="order_index" label="Order Index" min={0} validate={[required()]} />
      <SaveOnly />
    </>
  );
}

export function UnitsPage() {
  const { courseId = "" } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: course } = useGetOne<AdminCourse>("courses", { id: courseId }, { enabled: !!courseId });
  const { data: units, isLoading } = useGetList<AdminUnit>("units", {
    filter: { course_id: courseId },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "order_index", order: "ASC" },
  });

  const courseName = course?.title ?? courseId;

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <BreadcrumbNav
        crumbs={[
          { label: "Courses", to: "/content/courses" },
          { label: courseName },
        ]}
      />
      <PageHeader
        title={`Units — ${courseName}`}
        addLabel="Add Unit"
        onAdd={() => setDialog({ mode: "create", defaults: { course_id: courseId } })}
      />

      <Paper variant="outlined">
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Title</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Order</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!units?.length ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography color="text.secondary" sx={{ p: 1 }}>
                        No units for this course.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit) => (
                    <TableRow key={unit.id} hover>
                      <TableCell>{unit.title}</TableCell>
                      <TableCell>{unit.order_index}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit unit">
                          <IconButton
                            size="small"
                            onClick={() => setDialog({ mode: "edit", id: unit.id })}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View lessons">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              navigate(
                                `/content/courses/${courseId}/units/${unit.id}/lessons`
                              )
                            }
                          >
                            <ArrowForwardIosIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {dialog && (
        <ResourceDialog
          title={dialog.mode === "create" ? "Create Unit" : "Edit Unit"}
          resource="units"
          dialog={dialog}
          onClose={() => setDialog(null)}
          formContent={<UnitFormContent courseId={courseId} />}
        />
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Lessons page  (/content/courses/:courseId/units/:unitId/lessons)
// ---------------------------------------------------------------------------

function LessonFormContent({ unitId }: { unitId: string }) {
  return (
    <>
      <TextInput source="unit_id" label="Unit ID" fullWidth disabled />
      <TextInput
        source="lesson_form_id"
        label="Lesson Form ID (UUID)"
        fullWidth
        validate={[required()]}
        helperText="UUID of the lesson form template"
      />
      <TextInput source="title" fullWidth validate={[required()]} />
      <NumberInput source="order_index" label="Order Index" min={0} validate={[required()]} />
      <SaveOnly />
    </>
  );
}

export function LessonsPage() {
  const { courseId = "", unitId = "" } = useParams<{ courseId: string; unitId: string }>();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: course } = useGetOne<AdminCourse>("courses", { id: courseId }, { enabled: !!courseId });
  const { data: unit } = useGetOne<AdminUnit>("units", { id: unitId }, { enabled: !!unitId });
  const { data: lessons, isLoading } = useGetList<AdminLesson>("lessons", {
    filter: { unit_id: unitId },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "order_index", order: "ASC" },
  });

  const courseName = course?.title ?? courseId;
  const unitName = unit?.title ?? unitId;

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <BreadcrumbNav
        crumbs={[
          { label: "Courses", to: "/content/courses" },
          { label: courseName, to: `/content/courses/${courseId}/units` },
          { label: unitName },
        ]}
      />
      <PageHeader
        title={`Lessons — ${unitName}`}
        addLabel="Add Lesson"
        onAdd={() => setDialog({ mode: "create", defaults: { unit_id: unitId } })}
      />

      <Paper variant="outlined">
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Title</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Lesson Form ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Order</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!lessons?.length ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="text.secondary" sx={{ p: 1 }}>
                        No lessons for this unit.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  lessons.map((lesson) => (
                    <TableRow key={lesson.id} hover>
                      <TableCell>{lesson.title}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {lesson.lesson_form_id}
                        </Typography>
                      </TableCell>
                      <TableCell>{lesson.order_index}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit lesson">
                          <IconButton
                            size="small"
                            onClick={() => setDialog({ mode: "edit", id: lesson.id })}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View exercises">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              navigate(
                                `/content/courses/${courseId}/units/${unitId}/lessons/${lesson.id}/exercises`
                              )
                            }
                          >
                            <ArrowForwardIosIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {dialog && (
        <ResourceDialog
          title={dialog.mode === "create" ? "Create Lesson" : "Edit Lesson"}
          resource="lessons"
          dialog={dialog}
          onClose={() => setDialog(null)}
          formContent={<LessonFormContent unitId={unitId} />}
        />
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Exercises page (/content/courses/:courseId/units/:unitId/lessons/:lessonId/exercises)
// ---------------------------------------------------------------------------

export function ExercisesPage() {
  const {
    courseId = "",
    unitId = "",
    lessonId = "",
  } = useParams<{ courseId: string; unitId: string; lessonId: string }>();
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: course } = useGetOne<AdminCourse>("courses", { id: courseId }, { enabled: !!courseId });
  const { data: unit } = useGetOne<AdminUnit>("units", { id: unitId }, { enabled: !!unitId });
  const { data: lesson } = useGetOne<AdminLesson>("lessons", { id: lessonId }, { enabled: !!lessonId });
  const { data: exerciseTypes = [] } = useGetList<AdminExerciseType>("exercise-types", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });
  const { data: exercises, isLoading } = useGetList<AdminExercise>("exercises", {
    filter: { lesson_id: lessonId },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "id", order: "ASC" },
  });

  const courseName = course?.title ?? courseId;
  const unitName = unit?.title ?? unitId;
  const lessonName = lesson?.title ?? lessonId;

  const typeMap = useMemo(
    () => Object.fromEntries(exerciseTypes.map((t) => [t.id, t.name])),
    [exerciseTypes]
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1000 }}>
      <BreadcrumbNav
        crumbs={[
          { label: "Courses", to: "/content/courses" },
          { label: courseName, to: `/content/courses/${courseId}/units` },
          { label: unitName, to: `/content/courses/${courseId}/units/${unitId}/lessons` },
          { label: lessonName },
        ]}
      />
      <PageHeader
        title={`Exercises — ${lessonName}`}
        addLabel="Add Exercise"
        onAdd={() => setDialog({ mode: "create", defaults: { lesson_id: lessonId } })}
      />

      <Paper variant="outlined">
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!exercises?.length ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography color="text.secondary" sx={{ p: 1 }}>
                        No exercises for this lesson.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  exercises.map((ex, idx) => (
                    <TableRow key={ex.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Chip
                          label={typeMap[ex.exercise_type_id] ?? "Unknown"}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit exercise">
                          <IconButton
                            size="small"
                            onClick={() => setDialog({ mode: "edit", id: ex.id })}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <MistakesButton exerciseId={ex.id} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {dialog && (
        <ResourceDialog
          title={dialog.mode === "create" ? "Create Exercise" : "Edit Exercise"}
          resource="exercises"
          dialog={dialog}
          onClose={() => setDialog(null)}
          formContent={
            <ExerciseFormWithLoader
              exerciseId={dialog.mode === "edit" ? dialog.id : undefined}
            />
          }
        />
      )}
    </Box>
  );
}
