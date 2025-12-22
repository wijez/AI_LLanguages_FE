import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/api';
import {
  Box,
  Paper,
  Stack,
  Button,
  Chip,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Delete, Add } from '@mui/icons-material';

const TYPE_LABEL = {
  listening: 'Listening',
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  matching: 'Matching',
  fillgap: 'Fill gap',
  ordering: 'Ordering',
  quiz: 'Quiz',
  pron: 'Pronunciation',
};

// --- Component Form cho Quiz (để trong Dialog) ---
function QuizForm({ question: initialData, onSave, onCancel }) {
  const [text, setText] = React.useState(initialData.question_text || '');
  const [choices, setChoices] = React.useState(initialData.choices || []);

  const handleSave = () => {
    onSave({
      ...initialData,
      question_text: text,
      choices: choices,
    });
  };

  const setCorrect = (id) => {
    setChoices(
      choices.map((c) => ({ ...c, is_correct: c.id === id }))
    );
  };
  
  const addChoice = () => {
    setChoices([
      ...choices,
      { id: `new_${Date.now()}`, text: '', is_correct: choices.length === 0 }
    ]);
  };
  
  const updateChoiceText = (id, newText) => {
    setChoices(
      choices.map(c => c.id === id ? { ...c, text: newText } : c)
    );
  };

  const deleteChoice = (id) => {
    setChoices(choices.filter(c => c.id !== id));
  };

  return (
    <>
      <DialogTitle>{String(initialData.id).startsWith('new_') ? 'Thêm câu hỏi Quiz' : 'Sửa câu hỏi Quiz'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
        <TextField
          label="Nội dung câu hỏi"
          value={text}
          onChange={(e) => setText(e.target.value)}
          multiline
          rows={3}
          autoFocus
        />
        <Divider>Lựa chọn (Choices)</Divider>
        {choices.map((choice, index) => (
          <Stack key={choice.id} direction="row" spacing={1} alignItems="center">
            <TextField
              label={`Lựa chọn ${index + 1}`}
              value={choice.text}
              onChange={(e) => updateChoiceText(choice.id, e.target.value)}
              fullWidth
            />
            <Chip
              label={choice.is_correct ? 'Đáp án đúng' : 'Đặt làm đáp án'}
              color={choice.is_correct ? 'success' : 'default'}
              onClick={() => setCorrect(choice.id)}
            />
            <IconButton color="error" onClick={() => deleteChoice(choice.id)}>
              <Delete />
            </IconButton>
          </Stack>
        ))}
        <Button size="small" startIcon={<Add />} onClick={addChoice}>
          Thêm lựa chọn
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Hủy</Button>
        <Button onClick={handleSave} variant="contained">Lưu câu hỏi</Button>
      </DialogActions>
    </>
  );
}

// --- Component Form cho Fillgap (để trong Dialog) ---
function FillgapForm({ gap: initialData, onSave, onCancel }) {
  const [text, setText] = React.useState(initialData.text || '');
  const [answer, setAnswer] = React.useState(initialData.answer || '');

  const handleSave = () => {
    onSave({ ...initialData, text, answer });
  };

  return (
    <>
      <DialogTitle>{String(initialData.id).startsWith('new_') ? 'Thêm Fillgap' : 'Sửa Fillgap'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: 1 }}>
        <TextField
          label="Câu (dùng {gap} để đánh dấu)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          helperText="Ví dụ: Hello, my name {gap} John."
          autoFocus
        />
        <TextField
          label="Đáp án"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          helperText="Ví dụ: is"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Hủy</Button>
        <Button onClick={handleSave} variant="contained">Lưu</Button>
      </DialogActions>
    </>
  );
}


// ===== COMPONENT CHÍNH (EDITOR) =====
export default function SkillEditor() {
  const { id } = useParams(); // :id là Skill ID

  const [skill, setSkill] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  
  // --- State cho Editor ---
  const [toast, setToast] = React.useState({ msg: '', type: 'info' });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false); // Dấu hiệu đã thay đổi
  
  // --- State Local cho nội dung ---
  const [localQuizQs, setLocalQuizQs] = React.useState([]);
  const [localFillgaps, setLocalFillgaps] = React.useState([]);


  // --- State cho Dialog ---
  const [dialogState, setDialogState] = React.useState({ open: false, type: '', data: null });


  // --- Tải dữ liệu ---
  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const rawSkill = await api.Skills.get(id, { ttl: 0 });
        
        const normalized = {
          id: rawSkill.id,
          title: rawSkill.title || rawSkill.name || `Skill ${rawSkill.id}`,
          type: rawSkill.type,
          quiz_questions: rawSkill.quiz_questions || [],
          fillgaps: rawSkill.fillgaps || [],
        };
        
        if (!cancel) {
          setSkill(normalized);
          // Tải dữ liệu vào Local State
          setLocalQuizQs(normalized.quiz_questions || []);
          setLocalFillgaps(normalized.fillgaps || []);
          setIsDirty(false); // Reset
        }
      } catch (e) {
        if (!cancel) setErr(e?.message || 'Failed to load skill detail');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);


  // --- HÀM LƯU BATCH UPDATE (UPSERT) ---
  const handleSaveAllChanges = async () => {
    if (!skill) return;
    setIsSaving(true);
    
    let payload = {};
    if (skill.type === 'quiz') {
      payload.quiz_questions = localQuizQs;
    } else if (skill.type === 'fillgap') {
      payload.fillgaps = localFillgaps;
    }
    
    try {
      await api.Skills.upsertQuestions(id, payload);
      setIsDirty(false);
      setToast({ msg: 'Lưu thay đổi thành công!', type: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ msg: e?.message || 'Lưu thất bại', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Hàm quản lý Dialog ---
  const handleOpenDialog = (type, data = null) => {
    let initialData;
    if (type === 'quiz') {
      initialData = data || { id: `new_${Date.now()}`, question_text: '', choices: [] };
    } else if (type === 'fillgap') {
      initialData = data || { id: `new_${Date.now()}`, text: '', answer: '' };
    }
    setDialogState({ open: true, type, data: initialData });
  };

  const handleCloseDialog = () => {
    setDialogState({ open: false, type: '', data: null });
  };

  // Lưu từ Dialog -> Local State
  const handleSaveFromDialog = (savedData) => {
    const { type } = dialogState;
    const isNew = String(savedData.id).startsWith('new_');
    
    if (type === 'quiz') {
      if (isNew) {
        setLocalQuizQs(prev => [...prev, savedData]);
      } else {
        setLocalQuizQs(prev => prev.map(q => q.id === savedData.id ? savedData : q));
      }
    } else if (type === 'fillgap') {
      if (isNew) {
        setLocalFillgaps(prev => [...prev, savedData]);
      } else {
        setLocalFillgaps(prev => prev.map(g => g.id === savedData.id ? savedData : g));
      }
    }
    setIsDirty(true);
    handleCloseDialog();
  };
  
  // Hàm xóa (chỉ xóa ở local state)
  const handleDeleteItem = (type, id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mục này?')) return;
    
    if (type === 'quiz') {
      setLocalQuizQs(prev => prev.filter(q => q.id !== id));
    } else if (type === 'fillgap') {
      setLocalFillgaps(prev => prev.filter(g => g.id !== id));
    }
    setIsDirty(true);
  };

  
  // --- Render Quiz (Admin Editor) ---
  const renderQuiz = (qs) => (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Button 
        variant="contained" 
        startIcon={<Add />}
        onClick={() => handleOpenDialog('quiz')}
        sx={{ maxWidth: 200 }}
      >
        Thêm câu hỏi
      </Button>
      <DataGrid
        density="compact"
        rows={qs}
        getRowId={(r) => r.id}
        columns={[
          { field: 'question_text', headerName: 'Question', flex: 1, minWidth: 280 },
          {field: 'question_text_i18n', headerName: 'Question_i18n', flex:1.5, minWidth: 280},
          {
            field: 'choices',
            headerName: 'Choices',
            flex: 1.2,
            minWidth: 320,
            renderCell: ({ row }) => {
              const choices = Array.isArray(row.choices) ? row.choices : [];
              return (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>
                  {choices.map((c) => `${c.text}${c.is_correct ? ' ✅' : ''}`).join(' • ')}
                </div>
              );
            }
          },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: ({ row }) => (
              <Stack direction="row">
                <IconButton size="small" onClick={() => handleOpenDialog('quiz', row)}>
                  <Edit />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDeleteItem('quiz', row.id)}>
                  <Delete />
                </IconButton>
              </Stack>
            )
          }
        ]}
        pageSizeOptions={[5, 10, 25]}
        autoHeight
      />
    </Box>
  );

  // --- Render Fillgap (Admin Editor) ---
  const renderFillgap = (rows) => (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Button 
        variant="contained" 
        startIcon={<Add />}
        onClick={() => handleOpenDialog('fillgap')}
        sx={{ maxWidth: 200 }}
      >
        Thêm Gap
      </Button>
      <DataGrid
        density="compact"
        rows={rows}
        getRowId={(r) => r.id}
        columns={[
          { field: 'text', headerName: 'Text', flex: 1, minWidth: 280 },
          { field: 'answer', headerName: 'Answer', width: 220 },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: ({ row }) => (
              <Stack direction="row">
                <IconButton size="small" onClick={() => handleOpenDialog('fillgap', row)}>
                  <Edit />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDeleteItem('fillgap', row.id)}>
                  <Delete />
                </IconButton>
              </Stack>
            )
          }
        ]}
        pageSizeOptions={[5, 10, 25]}
        autoHeight
      />
    </Box>
  );

  // (Bạn có thể thêm các hàm render editor khác ở đây)


  // ========== UI ==========
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box component="h2" m={0} fontSize={22} fontWeight={800} sx={{ lineHeight: 1.2 }}>
          Edit Skill {skill ? `#${skill.id} – ${skill.title}` : ''}
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          {skill?.type && (
            <Chip
              label={`${TYPE_LABEL[skill.type] || skill.type}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          <Button component={Link} to={`/admin/skill/${id}`} variant="outlined">View Detail</Button>
          <Button component={Link} to="/admin/skills" variant="outlined">Back to List</Button>
        </Stack>
      </Stack>

      {err && <Box color="error.main">{err}</Box>}
      {loading && <Box color="text.secondary">Loading…</Box>}

      {/* Summary (Tùy chọn, có thể giữ lại) */}
      {skill && (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography fontWeight={700} mb={1}>Summary</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <div><b>ID:</b> {skill.id}</div>
              <div><b>Type:</b> {TYPE_LABEL[skill.type] || skill.type}</div>
            </Box>
        </Paper>
      )}

      {/* Content Editor */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography fontWeight={700}>Content Editor</Typography>
          {isDirty && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSaveAllChanges}
              disabled={isSaving}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
            </Button>
          )}
        </Stack>

        {!skill && <Typography color="text.secondary">No data</Typography>}

        {!!skill && (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {skill.type === 'quiz' && renderQuiz(localQuizQs)}
            {skill.type === 'fillgap' && renderFillgap(localFillgaps)}
            
            {/* Fallback cho các loại chưa có editor */}
            {[
              'quiz','fillgap'
            ].indexOf(skill.type) < 0 && (
              <Typography color="text.secondary">
                Editor cho loại '{skill.type}' chưa được implement.
              </Typography>
            )}
          </Box>
        )}
      </Paper>
      
      {/* DIALOG CHUNG */}
      <Dialog open={dialogState.open} onClose={handleCloseDialog} fullWidth maxWidth="md">
        {dialogState.type === 'quiz' && (
          <QuizForm 
            question={dialogState.data}
            onSave={handleSaveFromDialog}
            onCancel={handleCloseDialog}
          />
        )}
        {dialogState.type === 'fillgap' && (
          <FillgapForm
            gap={dialogState.data}
            onSave={handleSaveFromDialog}
            onCancel={handleCloseDialog}
          />
        )}
      </Dialog>
      
      {/* SNACKBAR */}
      <Snackbar
        open={!!toast.msg}
        autoHideDuration={3000}
        onClose={() => setToast({ msg: '', type: 'info' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.type}
          onClose={() => setToast({ msg: '', type: 'info' })}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}