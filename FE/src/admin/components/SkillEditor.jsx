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
import { QuizForm, FillgapForm, ListeningForm, OrderingForm, MatchingForm } from '../components/forms/SkillForms';
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
  const [localOrdering, setLocalOrdering] = React.useState([]);
  const [localMatching, setLocalMatching] = React.useState([]);
  const [localListening, setLocalListening] = React.useState([]);
  const [localSpeaking, setLocalSpeaking] = React.useState([]);
  const [localReading, setLocalReading] = React.useState([]);
  const [localWriting, setLocalWriting] = React.useState([]);
  const [localPronunciation, setLocalPronunciation] = React.useState([]);


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
          ordering_items: rawSkill.ordering_items || [],
          matching_pairs: rawSkill.matching_pairs || [],
          listening_prompts: rawSkill.listening_prompts || [],
          speaking_prompts: rawSkill.speaking_prompts || [],
          reading_passage: rawSkill.reading_passage || [],
          writing_questions: rawSkill.writing_questions || [],
          pronunciation_prompts: rawSkill.pronunciation_prompts || [],
        };
        
        if (!cancel) {
          setSkill(normalized);
          // Tải dữ liệu vào Local State
          setLocalQuizQs(normalized.quiz_questions || []);
          setLocalFillgaps(normalized.fillgaps || []);
          setLocalOrdering(normalized.ordering_items || []);
          setLocalMatching(normalized.matching_pairs || []);
          setLocalListening(normalized.listening_prompts || []);
          setLocalSpeaking(normalized.speaking_prompts || []);
          setLocalReading(normalized.reading_passage || []);
          setLocalWriting(normalized.writing_questions || []);
          setLocalPronunciation(normalized.pronunciation_prompts || []);
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
    switch (skill.type) {
      case 'quiz': payload.quiz_questions = localQuizQs; break;
      case 'fillgap': payload.fillgaps = localFillgaps; break;
      case 'ordering': payload.ordering_items = localOrdering; break;
      case 'matching': payload.matching_pairs = localMatching; break;
      case 'listening': payload.listening_prompts = localListening; break;
      case 'reading': payload.reading_passage = localReading; break;
      case 'writing': payload.writing_questions = localWriting; break;
      case 'pron': payload.pronunciation_prompts = localPronunciation; break;
      case 'speaking': payload.listening_prompts = localListening; break;
      default: break;
    }
    
    try {
      await api.Skills.patchQuestions(id, payload);
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
    } else if (type === 'matching') {
      initialData = data || { id: `new_${Date.now()}`, left_text: '', right_text: '' };
    } else if (type === 'ordering') {
      initialData = data || { id: `new_${Date.now()}`, text: '', order_index: localOrdering.length };
    } else if (type === 'listening') {
      initialData = data || { id: `new_${Date.now()}`, audio_url: '', question_text: '' };
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
    
    const updateList = (prev) => isNew 
    ? [...prev, savedData] 
    : prev.map(item => item.id === savedData.id ? savedData : item);

  switch (type) {
    case 'quiz': setLocalQuizQs(updateList); break;
    case 'fillgap': setLocalFillgaps(updateList); break;
    case 'ordering': setLocalOrdering(updateList); break;
    case 'matching': setLocalMatching(updateList); break;
    case 'listening': setLocalListening(updateList); break;
    case 'speaking': setLocalListening(updateList); break; 
    case 'pron': setLocalPronunciation(updateList); break;
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

  // --- Render Ordering (Sắp xếp thứ tự) ---
  const renderOrdering = (items) => (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Button 
        variant="contained" startIcon={<Add />}
        onClick={() => handleOpenDialog('ordering')}
        sx={{ maxWidth: 200 }}
      >
        Thêm mục sắp xếp
      </Button>
      <DataGrid
        density="compact"
        rows={items}
        getRowId={(r) => r.id}
        columns={[
          { field: 'order_index', headerName: 'Thứ tự', width: 100 },
          { field: 'text', headerName: 'Nội dung hiển thị', flex: 1, minWidth: 300 },
          {
            field: 'actions', headerName: 'Actions', width: 120, sortable: false,
            renderCell: ({ row }) => (
              <Stack direction="row">
                <IconButton size="small" onClick={() => handleOpenDialog('ordering', row)}><Edit /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDeleteItem('ordering', row.id)}><Delete /></IconButton>
              </Stack>
            )
          }
        ]}
        autoHeight
      />
    </Box>
  );

  // --- Render Matching (Ghép cặp) ---
  const renderMatching = (pairs) => (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Button 
        variant="contained" startIcon={<Add />}
        onClick={() => handleOpenDialog('matching')}
        sx={{ maxWidth: 200 }}
      >
        Thêm cặp ghép nối
      </Button>
      <DataGrid
        density="compact"
        rows={pairs}
        getRowId={(r) => r.id}
        columns={[
          { field: 'left_text', headerName: 'Vế trái (Câu hỏi)', flex: 1, minWidth: 250 },
          { field: 'right_text', headerName: 'Vế phải (Đáp án)', flex: 1, minWidth: 250 },
          {
            field: 'actions', headerName: 'Actions', width: 120, sortable: false,
            renderCell: ({ row }) => (
              <Stack direction="row">
                <IconButton size="small" onClick={() => handleOpenDialog('matching', row)}><Edit /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDeleteItem('matching', row.id)}><Delete /></IconButton>
              </Stack>
            )
          }
        ]}
        autoHeight
      />
    </Box>
  );

  // --- Render Listening / Speaking ---
  const renderListening = (prompts) => (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Button 
        variant="contained" startIcon={<Add />}
        onClick={() => handleOpenDialog('listening')}
        sx={{ maxWidth: 200 }}
      >
        Thêm Audio Prompt
      </Button>
      <DataGrid
        density="compact"
        rows={prompts}
        getRowId={(r) => r.id}
        columns={[
          { field: 'question_text', headerName: 'Câu hỏi / Text hiển thị', flex: 1, minWidth: 250 },
          { 
            field: 'audio_url', 
            headerName: 'Audio File', 
            flex: 1, 
            renderCell: ({ value }) => (
              <Typography variant="caption" sx={{ color: 'primary.main', textDecoration: 'underline', cursor: 'pointer' }}>
                {value ? value.split('/').pop() : 'No audio'}
              </Typography>
            )
          },
          {
            field: 'actions', headerName: 'Actions', width: 120, sortable: false,
            renderCell: ({ row }) => (
              <Stack direction="row">
                <IconButton size="small" onClick={() => handleOpenDialog('listening', row)}><Edit /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDeleteItem('listening', row.id)}><Delete /></IconButton>
              </Stack>
            )
          }
        ]}
        autoHeight
      />
    </Box>
  );
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
            {skill.type === 'ordering' && renderOrdering(localOrdering)}
            {skill.type === 'matching' && renderMatching(localMatching)}
            {(skill.type === 'listening' || skill.type === 'speaking') && renderListening(localListening)}
            
            {/* Fallback cho các loại chưa có editor */}
            {[
              'quiz','fillgap', 'ordering', 'matching', 'listening', 'speaking'
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
          {dialogState.type === 'quiz' && <QuizForm question={dialogState.data} onSave={handleSaveFromDialog} onCancel={handleCloseDialog} />}
          {dialogState.type === 'fillgap' && <FillgapForm gap={dialogState.data} onSave={handleSaveFromDialog} onCancel={handleCloseDialog} />}
          {dialogState.type === 'ordering' && <OrderingForm item={dialogState.data} onSave={handleSaveFromDialog} onCancel={handleCloseDialog} />}
          {dialogState.type === 'matching' && <MatchingForm pair={dialogState.data} onSave={handleSaveFromDialog} onCancel={handleCloseDialog} />}
          {dialogState.type === 'listening' && <ListeningForm prompt={dialogState.data} onSave={handleSaveFromDialog} onCancel={handleCloseDialog} />}
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