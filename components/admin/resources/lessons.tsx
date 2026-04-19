"use client";

import {
  Create,
  Datagrid,
  Edit,
  EditButton,
  List,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  SaveButton,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  Toolbar,
  required,
} from "react-admin";

const SaveOnlyToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

const lessonFilters = [
  <ReferenceInput key="unit_id" source="unit_id" reference="units" alwaysOn>
    <SelectInput label="Filter by Unit" optionText="title" />
  </ReferenceInput>,
];

export const LessonList = () => (
  <List filters={lessonFilters}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="unit_id" reference="units" label="Unit">
        <TextField source="title" />
      </ReferenceField>
      <TextField source="title" />
      <TextField source="order_index" label="Order" />
      <EditButton />
    </Datagrid>
  </List>
);

const LessonForm = () => (
  <SimpleForm toolbar={<SaveOnlyToolbar />}>
    <ReferenceInput source="unit_id" reference="units">
      <SelectInput optionText="title" fullWidth validate={[required()]} />
    </ReferenceInput>
    <TextInput
      source="lesson_form_id"
      label="Lesson Form ID (UUID)"
      fullWidth
      validate={[required()]}
      helperText="UUID of the lesson form template"
    />
    <TextInput source="title" fullWidth validate={[required()]} />
    <NumberInput source="order_index" label="Order Index" min={0} validate={[required()]} />
  </SimpleForm>
);

export const LessonCreate = () => (
  <Create>
    <LessonForm />
  </Create>
);

export const LessonEdit = () => (
  <Edit>
    <LessonForm />
  </Edit>
);
