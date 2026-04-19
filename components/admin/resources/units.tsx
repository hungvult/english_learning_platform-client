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

const unitFilters = [
  <ReferenceInput key="course_id" source="course_id" reference="courses" alwaysOn>
    <SelectInput label="Filter by Course" optionText="title" />
  </ReferenceInput>,
];

export const UnitList = () => (
  <List filters={unitFilters}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="course_id" reference="courses" label="Course">
        <TextField source="title" />
      </ReferenceField>
      <TextField source="title" />
      <TextField source="order_index" label="Order" />
      <EditButton />
    </Datagrid>
  </List>
);

const UnitForm = () => (
  <SimpleForm toolbar={<SaveOnlyToolbar />}>
    <ReferenceInput source="course_id" reference="courses">
      <SelectInput optionText="title" fullWidth validate={[required()]} />
    </ReferenceInput>
    <TextInput source="title" fullWidth validate={[required()]} />
    <NumberInput source="order_index" label="Order Index" min={0} validate={[required()]} />
  </SimpleForm>
);

export const UnitCreate = () => (
  <Create>
    <UnitForm />
  </Create>
);

export const UnitEdit = () => (
  <Edit>
    <UnitForm />
  </Edit>
);
