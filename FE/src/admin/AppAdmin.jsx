import * as React from "react";
import {
  Outlet,
  Link,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Stack,
  Avatar,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuRounded from "@mui/icons-material/MenuRounded";
import DashboardCustomizeRounded from "@mui/icons-material/DashboardCustomizeRounded";
import TranslateRounded from "@mui/icons-material/TranslateRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import ExtensionRounded from "@mui/icons-material/ExtensionRounded";
import SpellcheckRounded from "@mui/icons-material/SpellcheckRounded";
import ChatRounded from "@mui/icons-material/ChatRounded";

import Dashboard from "./components/Dashboard";
import ResourceTable from "./components/ResourceTable";
import TopicDetail from "./components/TopicDetail";
import SkillDetail from "./pages/SkillDetail";
import SkillEditor from "./components/SkillEditor";
import RoleplayDetail from "./components/RoleplayDetail";
import RolePlayBlockDetails from "./components/RolePlayBlockDetails";

const drawerWidth = 240;

// chuẩn enum type theo models.Skill.SkillType
const SKILL_TYPE_OPTIONS = [
  { value: "listening", label: "Listening" },
  { value: "speaking", label: "Speaking" },
  { value: "reading", label: "Reading" },
  { value: "writing", label: "Writing" },
  { value: "matching", label: "Matching" },
  { value: "fillgap", label: "Fill in the blanks" },
  { value: "ordering", label: "Reorder words" },
  { value: "quiz", label: "Generic MCQ/QA" },
  { value: "pron", label: "Pronunciation" },
];

const Shell = () => {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = React.useState(mdUp);

  React.useEffect(() => setOpen(mdUp), [mdUp]);

  const DrawerContent = (
    <>
      <Toolbar />
      <List
        subheader={<ListSubheader>Dashboard</ListSubheader>}
        sx={{ "& a": { color: "inherit", textDecoration: "none" } }}
      >
        <Link to="/admin">
          <ListItemButton>
            <DashboardCustomizeRounded />
            <ListItemText sx={{ ml: 1 }} primary="Default" />
          </ListItemButton>
        </Link>
      </List>
      <List subheader={<ListSubheader>Models</ListSubheader>}>
        <Link to="/admin/users">
          <ListItemButton>
            <PeopleRounded />
            <ListItemText sx={{ ml: 1 }} primary="Users" />
          </ListItemButton>
        </Link>
        <Link to="/admin/languages">
          <ListItemButton>
            <TranslateRounded />
            <ListItemText sx={{ ml: 1 }} primary="Languages" />
          </ListItemButton>
        </Link>
        <Link to="/admin/topics">
          <ListItemButton>
            <CategoryRounded />
            <ListItemText sx={{ ml: 1 }} primary="Topics" />
          </ListItemButton>
        </Link>

        <Link to="/admin/words">
          <ListItemButton>
            <SpellcheckRounded />
            <ListItemText sx={{ ml: 1 }} primary="Word Bank" />
          </ListItemButton>
        </Link>
        <Link to="/admin/roleplay">
          <ListItemButton>
            <ChatRounded />
            <ListItemText sx={{ ml: 1 }} primary="RolePlay" />
          </ListItemButton>
        </Link>
        <Link to="/admin/skills">
          <ListItemButton>
            <ExtensionRounded />
            <ListItemText sx={{ ml: 1 }} primary="Skills" />
          </ListItemButton>
        </Link>
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100svh", bgcolor: "#f6f8fb" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: "#fff",
          color: "#111",
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() => setOpen((v) => !v)}
            edge="start"
            sx={{ mr: 1, display: { md: "none" } }}
          >
            <MenuRounded />
          </IconButton>
          <Typography fontWeight={800}>AIvory Admin</Typography>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={mdUp ? "permanent" : "temporary"}
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {DrawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 2.5, md: 3 },
          width: { xs: "100%", md: `calc(100% - ${open ? drawerWidth : 0}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

function TopicsTableWrapper({ columns }) {
  const navigate = useNavigate();
  return (
    <ResourceTable
      title="Topics"
      resource="/topics/"
      columns={columns}
      form={[
        { name: "language", label: "Language ID", required: true },
        { name: "slug", label: "Slug", required: true },
        { name: "title", label: "Title", required: true },
        { name: "description", label: "Description" },
        { name: "order", label: "Order", type: "number", required: true },
        { name: "golden", label: "Golden (true/false)" },
      ]}
      onViewRow={(row) => navigate(`/admin/topics/${row.id}`)}
    />
  );
}

function RoleplayTableWrapper({ columns }) {
  const navigate = useNavigate();
  return (
    <ResourceTable
      title="RolePlay Scenarios"
      resource="/roleplay-scenario/"
      columns={columns}
      form={[]}
      onViewRow={(row) => navigate(`/admin/roleplay/${row.id}`)}
    />
  );
}

function SkillsTableWrapper({ columns }) {
  const navigate = useNavigate();
  return (
    <ResourceTable
      title="Skills"
      resource="/skills/" // 👉 lấy full /api/skills/, không truyền type
      columns={columns}
      form={[
        { name: "title", label: "Title", required: true },
        {
          name: "type",
          label: "Type",
          type: "select",
          required: true,
          options: SKILL_TYPE_OPTIONS,
        },
        {
          name: "language_code",
          label: "Language code",
          required: true,
          helperText: "vd: en, vi, ja",
        },
        {
          name: "xp_reward",
          label: "XP Reward",
          type: "number",
          required: true,
        },
        {
          name: "duration_seconds",
          label: "Duration (seconds)",
          type: "number",
          required: true,
        },
        {
          name: "difficulty",
          label: "Difficulty",
          type: "number",
          required: true,
          helperText: "mức 1–5 hoặc tuỳ phân cấp",
        },
        {
          name: "tags",
          label: "Tags (CSV)",
          helperText: "vd: A1,greetings,roleplay",
        },
        {
          name: "is_active",
          label: "Active",
          type: "boolean",
        },
      ]}
      transformPayload={(payload) => {
        // convert tags CSV -> array JSON
        if (typeof payload.tags === "string") {
          payload.tags = payload.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return payload;
      }}
      onViewRow={(row) => navigate(`/admin/skill/${row.id}`)}
      searchPlaceholder="Search skills..."
    />
  );
}

export default function AppAdmin() {
  const columns = {
    users: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "username", headerName: "Username", width: 160 },
      { field: "email", headerName: "Email", width: 220 },
      { field: "last_active", headerName: "Last Active", width: 180 },
    ],
    languages: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "name", headerName: "Name", width: 180 },
      { field: "abbreviation", headerName: "Abbr", width: 120 },
      { field: "native_name", headerName: "Native", width: 200 },
      { field: "direction", headerName: "Dir", width: 90 },
    ],
    topics: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "slug", headerName: "Slug", width: 160 },
      { field: "title", headerName: "Title", width: 220 },
      { field: "order", headerName: "Order", width: 90, type: "number" },
      { field: "golden", headerName: "Golden", width: 90, type: "boolean" },
    ],
    words: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "text", headerName: "Text", width: 200 },
      { field: "language", headerName: "Language ID", width: 100 },
      { field: "part_of_speech", headerName: "Part of Speech", width: 150 },
    ],
    roleplay: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "slug", headerName: "Slug", width: 150 },
      { field: "title", headerName: "Title", width: 250 },
      { field: "level", headerName: "Level", width: 100 },
      { field: "is_active", headerName: "Active", type: "boolean" },
    ],
    skills: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "title", headerName: "Title", width: 240 },
      { field: "type", headerName: "Type", width: 120 },
      { field: "language_code", headerName: "Lang", width: 100 },
      { field: "xp_reward", headerName: "XP", width: 90, type: "number" },
      {
        field: "difficulty",
        headerName: "Diff",
        width: 90,
        type: "number",
      },
      {
        field: "is_active",
        headerName: "Active",
        width: 90,
        type: "boolean",
      },
    ],
  };

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />

        <Route
          path="users"
          element={
            <ResourceTable
              title="Users"
              resource="/users/"
              columns={columns.users}
              form={[
                { name: "username", label: "Username", required: true },
                {
                  name: "email",
                  label: "Email",
                  type: "email",
                  required: true,
                },
                {
                  name: "password",
                  label: "Password",
                  type: "password",
                  required: true,
                },
              ]}
            />
          }
        />

        <Route
          path="languages"
          element={
            <ResourceTable
              title="Languages"
              resource="/languages/"
              columns={columns.languages}
              form={[
                { name: "name", label: "Name", required: true },
                {
                  name: "abbreviation",
                  label: "Abbreviation",
                  helperText: "e.g. en, vi, ja",
                  required: true,
                },
                { name: "native_name", label: "Native name" },
                { name: "direction", label: "Direction", required: true },
              ]}
            />
          }
        />

        {/* Topics list + Topic detail */}
        <Route
          path="topics"
          element={<TopicsTableWrapper columns={columns.topics} />}
        />
        <Route path="topics/:id" element={<TopicDetail />} />

        {/* Skills list + detail / editor */}
        <Route
          path="skills"
          element={<SkillsTableWrapper columns={columns.skills} />}
        />
        <Route path="skill/:id" element={<SkillDetail />} />
        <Route path="skill/:id/edit" element={<SkillEditor />} />

        <Route
          path="words"
          element={
            <ResourceTable
              title="Word Bank"
              resource="/words/"
              columns={columns.words}
              form={[]}
            />
          }
        />
        <Route
          path="roleplay"
          element={<RoleplayTableWrapper columns={columns.roleplay} />}
        />
        <Route path="roleplay/:id" element={<RoleplayDetail />} />
        <Route path="roleplay-block/:id" element={<RolePlayBlockDetails />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
