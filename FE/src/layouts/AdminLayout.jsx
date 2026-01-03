import * as React from "react";
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
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link, Outlet } from "react-router-dom";

// Icons
import MenuRounded from "@mui/icons-material/MenuRounded";
import DashboardCustomizeRounded from "@mui/icons-material/DashboardCustomizeRounded";
import TranslateRounded from "@mui/icons-material/TranslateRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import ExtensionRounded from "@mui/icons-material/ExtensionRounded";
import SpellcheckRounded from "@mui/icons-material/SpellcheckRounded";
import ChatRounded from "@mui/icons-material/ChatRounded";
import NotificationsRounded from "@mui/icons-material/NotificationsRounded";
import AdminDropdown from "../components/Dropdowns/AdminDropdown"
import { Air, Airlines } from "@mui/icons-material";

const drawerWidth = 240;

export default function AdminLayout() {
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
      <List subheader={<ListSubheader>Models</ListSubheader>} sx={{ "& a": { color: "inherit", textDecoration: "none" } }}>
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
        <Link to="/admin/notifications">
          <ListItemButton>
            <NotificationsRounded />
            <ListItemText sx={{ ml: 1 }} primary="Notifications" />
          </ListItemButton>
        </Link>
        <Link to="/admin/recommend">
        <ListItemButton>
            <Airlines />
        <ListItemText sx={{ ml: 1 }} primary="Recommend" />
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
            <AdminDropdown />
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
}