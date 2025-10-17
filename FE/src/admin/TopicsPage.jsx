// src/admin/TopicsPage.jsx
import * as React from 'react';
import { Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert } from '@mui/material';
import LibraryBooksRounded from '@mui/icons-material/LibraryBooksRounded';
import MilitaryTechRounded from '@mui/icons-material/MilitaryTechRounded';
import { api } from '../api/api';
import ResourceTable from './ResourceTable';

export default function TopicsPage({ columns }) {
  const [openLesson, setOpenLesson] = React.useState(false);
  const [openSkill, setOpenSkill]   = React.useState(false);
  const [selectedTopic, setSelectedTopic] = React.useState(null);
  const [toast, setToast] = React.useState('');

  const [lessonForm, setLessonForm] = React.useState({ title: '', order: '' });
  const [skillForm,  setSkillForm]  = React.useState({ name: '', title: '' });

  // callback render ở header của bảng
  const renderActions = ({ selection, reload }) => {
    const firstId = selection?.[0] ?? null;
    return (
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          startIcon={<LibraryBooksRounded />}
          disabled={!firstId}
          onClick={() => { setSelectedTopic(firstId); setOpenLesson(true); }}
        >
          Tạo lesson
        </Button>
        <Button
          variant="contained"
          startIcon={<MilitaryTechRounded />}
          disabled={!firstId}
          onClick={() => { setSelectedTopic(firstId); setOpenSkill(true); }}
        >
          Tạo skill
        </Button>
      </Stack>
    );
  };

  const createLesson = async (reload) => {
    try {
      await api.post('/lessons/', { topic: selectedTopic, ...lessonForm });
      setOpenLesson(false); setLessonForm({ title: '', order: '' });
      setToast('Tạo lesson thành công'); reload?.();
    } catch (e) {
      setToast('Tạo lesson thất bại'); console.error(e);
    }
  };

  const createSkill = async (reload) => {
    try {
      await api.post('/skills/', { topic: selectedTopic, ...skillForm });
      setOpenSkill(false); setSkillForm({ name: '', title: '' });
      setToast('Tạo skill thành công'); reload?.();
    } catch (e) {
      setToast('Tạo skill thất bại'); console.error(e);
    }
  };

  // Lưu lại reload để dùng khi submit (nhận từ ResourceTable qua renderActions)
  const reloadRef = React.useRef(null);
  const headerActionsWithReload = (ctx) => { reloadRef.current = ctx.reload; return renderActions(ctx); };

  return (
    <>
      <ResourceTable
        title="Topics"
        resource="/topics/"
        columns={columns}
        form={[
          { name: 'language', label: 'Language ID' },
          { name: 'slug', label: 'Slug' },
          { name: 'title', label: 'Title' },
          { name: 'description', label: 'Description' },
          { name: 'order', label: 'Order', type: 'number' },
          { name: 'golden', label: 'Golden (true/false)' }
        ]}
        headerActions={headerActionsWithReload}
      />

      {/* Dialog tạo lesson */}
      <Dialog open={openLesson} onClose={() => setOpenLesson(false)} fullWidth maxWidth="sm">
        <DialogTitle>Tạo lesson cho Topic #{selectedTopic}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={lessonForm.title}
              onChange={(e)=>setLessonForm(s=>({...s, title: e.target.value}))} required />
            <TextField label="Order" type="number" value={lessonForm.order}
              onChange={(e)=>setLessonForm(s=>({...s, order: e.target.value}))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenLesson(false)}>Huỷ</Button>
          <Button variant="contained" onClick={()=>createLesson(reloadRef.current)}>Tạo lesson</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog tạo skill */}
      <Dialog open={openSkill} onClose={() => setOpenSkill(false)} fullWidth maxWidth="sm">
        <DialogTitle>Tạo skill cho Topic #{selectedTopic}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name (slug)" value={skillForm.name}
              onChange={(e)=>setSkillForm(s=>({...s, name: e.target.value}))} required />
            <TextField label="Title" value={skillForm.title}
              onChange={(e)=>setSkillForm(s=>({...s, title: e.target.value}))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenSkill(false)}>Huỷ</Button>
          <Button variant="contained" onClick={()=>createSkill(reloadRef.current)}>Tạo skill</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={()=>setToast('')}>
        <Alert severity="info" onClose={()=>setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
