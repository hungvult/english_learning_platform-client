"use client";

import {
  Create,
  Datagrid,
  Edit,
  EditButton,
  List,
  SaveButton,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  Toolbar,
  required,
} from "react-admin";

const CEFR_CHOICES = [
  { id: "A1", name: "A1" },
  { id: "A2", name: "A2" },
  { id: "B1", name: "B1" },
  { id: "B2", name: "B2" },
  { id: "C1", name: "C1" },
  { id: "C2", name: "C2" },
];

const SaveOnlyToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const CourseList = () => (
  <List>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="title" />
      <TextField source="expected_cefr_level" label="CEFR Level" />
      <EditButton />
    </Datagrid>
  </List>
);

const CourseForm = () => (
  <SimpleForm toolbar={<SaveOnlyToolbar />}>
    <TextInput source="title" fullWidth validate={[required()]} />
    <SelectInput
      source="expected_cefr_level"
      label="CEFR Level"
      choices={CEFR_CHOICES}
      validate={[required()]}
    />
  </SimpleForm>
);

export const CourseCreate = () => (
  <Create>
    <CourseForm />
  </Create>
);

export const CourseEdit = () => (
  <Edit>
    <CourseForm />
  </Edit>
);
