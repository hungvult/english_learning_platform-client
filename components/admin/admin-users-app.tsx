"use client";

import {
  AdminContext,
  AdminUI,
  BooleanField,
  CustomRoutes,
  Datagrid,
  Edit,
  EditButton,
  Layout,
  List,
  Menu,
  NumberField,
  NumberInput,
  Resource,
  SaveButton,
  SimpleForm,
  TextField,
  TextInput,
  Toolbar,
  required,
} from "react-admin";
import { BrowserRouter, Route } from "react-router-dom";
import { createTheme } from "@mui/material/styles";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import GroupIcon from "@mui/icons-material/Group";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { Box, Button } from "@mui/material";
import type { LayoutProps } from "react-admin";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { adminDataProvider } from "@/lib/admin-data-provider";
import { ContentExplorer } from "@/components/admin/content-explorer";

const adminTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#58CC02",
      dark: "#46A302",
      light: "#89E219",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F7F7F7",
      paper: "#FFFFFF",
    },
  },
  shape: {
    borderRadius: 12,
  },
});

const i18nProvider = polyglotI18nProvider(() => {
  return {
    ...englishMessages,
    resources: {
      users: {
        name: "User |||| Users",
        fields: {
          username: "Username",
          email: "Email",
          is_admin: "Admin",
          cefr_level: "CEFR Level",
          total_xp: "XP",
          hearts: "Hearts",
          gems: "Gems",
          current_streak: "Streak",
        },
      },
    },
  };
}, "en");

const UserSaveToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

const UserList = () => (
  <List>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="username" />
      <TextField source="email" />
      <BooleanField source="is_admin" />
      <TextField source="cefr_level" />
      <NumberField source="total_xp" />
      <NumberField source="hearts" />
      <NumberField source="gems" />
      <NumberField source="current_streak" />
      <EditButton />
    </Datagrid>
  </List>
);

const UserEdit = () => (
  <Edit>
    <SimpleForm toolbar={<UserSaveToolbar />}>
      <TextInput source="username" fullWidth validate={[required()]} />
      <TextInput source="email" fullWidth validate={[required()]} />
      <TextInput source="cefr_level" fullWidth />
      <NumberInput source="total_xp" min={0} />
      <NumberInput source="hearts" min={0} />
      <NumberInput source="gems" min={0} />
      <NumberInput source="current_streak" min={0} />
    </SimpleForm>
  </Edit>
);

const NoAppBar = () => null;

const onLogout = async () => {
  try {
    await api("/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  } catch {
    toast.error("Logout failed.");
  }
};

const AdminMenu = () => (
  <Menu>
    <Menu.DashboardItem leftIcon={<DashboardIcon />} />
    <Menu.Item to="/content" primaryText="Content Explorer" leftIcon={<AccountTreeIcon />} />
    <Menu.ResourceItems />

    <Box sx={{ mt: 2, px: 2, pb: 2 }}>
      <Button
        variant="outlined"
        color="error"
        fullWidth
        onClick={onLogout}
        sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700 }}
      >
        Log out
      </Button>
    </Box>
  </Menu>
);

const AdminLayout = (props: LayoutProps) => (
  <Layout
    {...props}
    appBar={NoAppBar}
    menu={AdminMenu}
    sx={{
      "& .RaLayout-contentWithSidebar": {
        marginTop: 0,
      },
    }}
  />
);

const Dashboard = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
    <p className="mt-2 text-sm text-neutral-600">
      Manage courses, units, lessons, exercises, and users.
    </p>
  </div>
);

export function AdminUsersApp() {
  return (
    <BrowserRouter basename="/admin">
      <AdminContext
        dataProvider={adminDataProvider}
        i18nProvider={i18nProvider}
        theme={adminTheme}
        darkTheme={null}
        defaultTheme="light"
      >
        <AdminUI title="Admin" dashboard={Dashboard} layout={AdminLayout}>
          {/* Custom page: file-explorer for Course→Unit→Lesson→Exercise */}
          <CustomRoutes>
            <Route path="/content" element={<ContentExplorer />} />
          </CustomRoutes>

          {/* Content resources registered for data access (no dedicated list pages) */}
          <Resource name="courses" recordRepresentation="title" />
          <Resource name="units" recordRepresentation="title" />
          <Resource name="lessons" recordRepresentation="title" />
          <Resource name="exercises" />
          <Resource name="exercise-types" recordRepresentation="name" />

          {/* Users resource – full list + edit */}
          <Resource
            name="users"
            icon={GroupIcon}
            list={UserList}
            edit={UserEdit}
            recordRepresentation="username"
          />
        </AdminUI>
      </AdminContext>
    </BrowserRouter>
  );
}

