// src/admin/AppAdmin.jsx
import * as React from 'react';
import { Outlet, Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  Box, CssBaseline, AppBar, Toolbar, IconButton, Typography,
  Drawer, List, ListItemButton, ListItemText, ListSubheader, Stack, Avatar, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuRounded from '@mui/icons-material/MenuRounded';
import DashboardCustomizeRounded from '@mui/icons-material/DashboardCustomizeRounded';
import TranslateRounded from '@mui/icons-material/TranslateRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';

import Dashboard from './Dashboard';
import ResourceTable from './ResourceTable';
import TopicDetail from './TopicDetail';

const drawerWidth = 240;

const Shell = () => {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = React.useState(mdUp);

  React.useEffect(() => setOpen(mdUp), [mdUp]);

  const DrawerContent = (
    <>
      <Toolbar />
      <List
        subheader={<ListSubheader>Dashboard</ListSubheader>}
        sx={{ '& a': { color: 'inherit', textDecoration: 'none' } }}
      >
        <Link to="/admin">
          <ListItemButton>
            <DashboardCustomizeRounded/>
            <ListItemText sx={{ ml:1 }} primary="Default" />
          </ListItemButton>
        </Link>
      </List>
      <List subheader={<ListSubheader>Models</ListSubheader>}>
        <Link to="/admin/users">
          <ListItemButton>
            <PeopleRounded/><ListItemText sx={{ ml:1 }} primary="Users" />
          </ListItemButton>
        </Link>
        <Link to="/admin/languages">
          <ListItemButton>
            <TranslateRounded/><ListItemText sx={{ ml:1 }} primary="Languages" />
          </ListItemButton>
        </Link>
        <Link to="/admin/topics">
          <ListItemButton>
            <CategoryRounded/><ListItemText sx={{ ml:1 }} primary="Topics" />
          </ListItemButton>
        </Link>
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100svh', bgcolor: '#f6f8fb' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (t)=>t.zIndex.drawer+1, bgcolor: '#fff', color: '#111' }}>
        <Toolbar>
          <IconButton onClick={() => setOpen((v)=>!v)} edge="start" sx={{ mr: 1, display: { md: 'none' } }}>
            <MenuRounded/>
          </IconButton>
          <Typography fontWeight={800}>BERRY Admin</Typography>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={mdUp ? 'permanent' : 'temporary'}
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        {DrawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 2.5, md: 3 },
          width: { xs: '100%', md: `calc(100% - ${open ? drawerWidth : 0}px)` }
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
        { name: 'language', label: 'Language ID', required: true },
        { name: 'slug', label: 'Slug', required: true },
        { name: 'title', label: 'Title', required: true },
        { name: 'description', label: 'Description' },
        { name: 'order', label: 'Order', type: 'number', required: true },
        { name: 'golden', label: 'Golden (true/false)' }
      ]}
      onViewRow={(row) => navigate(`/admin/topics/${row.id}`)} // ✅ nút View
    />
  );
}

export default function AppAdmin() {
  const columns = {
    users: [
      { field: 'id', headerName: 'ID', width: 70 },
      { field: 'username', headerName: 'Username', width: 160 },
      { field: 'email', headerName: 'Email', width: 220 },
      { field: 'last_active', headerName: 'Last Active', width: 180 },
    ],
    languages: [
      { field: 'id', headerName: 'ID', width: 70 },
      { field: 'name', headerName: 'Name', width: 180 },
      { field: 'abbreviation', headerName: 'Abbr', width: 120 },
      { field: 'native_name', headerName: 'Native', width: 200 },
      { field: 'direction', headerName: 'Dir', width: 90 },
    ],
    topics: [
      { field: 'id', headerName: 'ID', width: 70 },
      { field: 'slug', headerName: 'Slug', width: 160 },
      { field: 'title', headerName: 'Title', width: 220 },
      { field: 'order', headerName: 'Order', width: 90, type: 'number' },
      { field: 'golden', headerName: 'Golden', width: 90, type: 'boolean' },
    ]
  };

  return (
    <Routes>
      <Route element={<Shell/>}>
        <Route index element={<Dashboard/>} />

        <Route path="users" element={
          <ResourceTable
            title="Users"
            resource="/users/"
            columns={columns.users}
            form={[
              { name: 'username', label: 'Username', required: true },
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'password', label: 'Password', type: 'password', required: true }
            ]}
          />
        }/>

        <Route path="languages" element={
          <ResourceTable
            title="Languages"
            resource="/languages/"
            columns={columns.languages}
            form={[
              { name: 'name', label: 'Name', required: true },
              { name: 'abbreviation', label: 'Abbreviation', helperText: 'e.g. en, vi, ja', required: true },
              { name: 'native_name', label: 'Native name' },
              { name: 'direction', label: 'Direction', required: true },
            ]}
          />
        }/>

        {/* Topics list + Topic detail */}
        <Route path="topics" element={<TopicsTableWrapper columns={columns.topics} />} />
        <Route path="topics/:id" element={<TopicDetail />} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
