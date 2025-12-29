import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/api';
import {
  Box, Paper, Stack, Button, Chip, Typography, CircularProgress, Divider,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText,
  IconButton, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import LessonEditor from "./LessonEditor";
import UniversalEditor from './forms/UniversalEditor'; // Đảm bảo đúng đường dẫn

const CREATE_LESSON_FIELDS = [
  { name: "title", label: "Tiêu đề Lesson", type: "text", required: true },
  { name: "order", label: "Thứ tự (Order)", type: "number", required: true },
  { name: "xp_reward", label: "XP Reward", type: "number", min: 0 },
  { name: "duration_seconds", label: "Thời lượng (giây)", type: "number", min: 0 },
];

// --- COMPONENT CON: Chỉ hiển thị list skill ---
function LessonSkillList({ lessonId }) {
  const [skills, setSkills] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  const loadSkills = React.useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await api.Lessons.skills(lessonId, {}, { ttl: 0 });
      setSkills(data || []);
    } catch (e) {
      console.error(e);
      setErr('Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  React.useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm(`Bạn có chắc muốn xóa Skill ID: ${skillId}?`)) return;
    try {
      await api.Skills.remove(skillId);
      loadSkills();
    } catch (e) {
      alert('Xóa thất bại: ' + (e?.message || 'Lỗi'));
    }
  };

  if (loading) return <CircularProgress size={24} sx={{ mx: 2 }} />;
  if (err) return <Typography color="error.main" sx={{ mx: 2 }}>{err}</Typography>;
  if (skills.length === 0) return <Typography color="text.secondary" sx={{ mx: 2 }}>Trống.</Typography>;

  return (
    <List dense disablePadding>
      {skills.map((skill) => (
        <ListItem
          key={skill.id}
          divider
          secondaryAction={
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Xem">
                <IconButton component={Link} to={`/admin/skill/${skill.id}`} size="small"><VisibilityIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Sửa">
                <IconButton component={Link} to={`/admin/skill/${skill.id}/edit`} size="small"><EditIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Xóa">
                <IconButton onClick={() => handleDeleteSkill(skill.id)} size="small"><DeleteIcon /></IconButton>
              </Tooltip>
            </Stack>
          }
        >
          <ListItemText primary={skill.title} secondary={`ID: ${skill.id} | ${skill.type}`} />
        </ListItem>
      ))}
    </List>
  );
}

// ===== COMPONENT CHÍNH =====
export default function TopicDetail() {
  const { id } = useParams(); // Topic ID

  const [topic, setTopic] = React.useState(null);
  const [lessons, setLessons] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  // State cho tạo lesson mới (CHUYỂN VỀ ĐÂY)
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [initData, setInitData] = React.useState({});

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setErr('');
      const topicData = await api.Topics.get(id, { ttl: 0 });
      setTopic(topicData);
      const lessonData = await api.Topics.lessons(id, { page_size: 200 }, { ttl: 0 });
      setLessons(lessonData || []);
    } catch (e) {
      setErr(e?.message || 'Failed to load topic detail');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler mở form
  const handleOpenCreate = () => {
    const maxOrder = lessons.reduce((max, l) => Math.max(max, l.order || 0), 0);
    setInitData({
      title: "",
      order: maxOrder + 1,
      xp_reward: 10,
      duration_seconds: 120,
    });
    setCreateOpen(true);
  };

  // Handler submit
  const handleCreateSubmit = async (patch) => {
    const payload = { ...initData, ...patch };
    if (!payload.title) {
      alert("Vui lòng nhập tiêu đề!");
      return;
    }
    try {
      setCreating(true);
      // Gọi API POST /topics/{id}/lessons/
      await api.Topics.createLesson(id, payload);
      setCreateOpen(false);
      loadData(); // Reload list
    } catch (e) {
      console.error(e);
      alert("Tạo thất bại: " + (e?.message || "Lỗi không xác định"));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if(!window.confirm("Xóa Lesson này?")) return;
    try {
      await api.Lessons.remove(lessonId);
      loadData();
    } catch(e) {
      alert("Xóa thất bại");
    }
  }

  if (loading && !topic) return <Box sx={{ p: 2 }}><CircularProgress /></Box>;
  if (err) return <Box sx={{ p: 2, color: 'error.main' }}>{err}</Box>;

  return (
    <Box sx={{ p: 2, display: 'grid', gap: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box component="h2" m={0} fontSize={22} fontWeight={800} sx={{ lineHeight: 1.2 }}>
          Topic: {topic?.title}
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip label={`ID: ${topic.id}`} size="small" />
          <Chip label={`Lang: ${topic.language}`} size="small" />
          <Button component={Link} to="/admin/topics" variant="outlined">
            Quay lại Topics
          </Button>
        </Stack>
      </Stack>
      <Divider />

      {/* Danh sách Lessons */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography fontWeight={700}>Danh sách Lessons ({lessons.length})</Typography>
          <Button startIcon={<AddIcon />} size="small" variant="contained" onClick={handleOpenCreate}>
            Thêm Lesson mới
          </Button>
        </Stack>
        
        {lessons.length === 0 && <Typography color="text.secondary">Chưa có lesson nào.</Typography>}
        
        {lessons.map((lesson) => (
          <Accordion key={lesson.id} TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                <Typography fontWeight={500} sx={{ flex: 1 }}>{lesson.title}</Typography>
                <Chip label={`Order: ${lesson.order}`} size="small" />
                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {/* Sử dụng component LessonEditor nếu muốn full chức năng, hoặc LessonSkillList đơn giản */}
              <LessonEditor lessonId={lesson.id} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      <UniversalEditor
        open={createOpen}
        title="Tạo Lesson Mới"
        loading={creating}
        initialValues={initData}
        fields={CREATE_LESSON_FIELDS}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </Box>
  );
}