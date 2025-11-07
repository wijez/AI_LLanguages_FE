import * as React from 'react';
import { useParams, Link} from 'react-router-dom';
import { api } from '../../api/api';
import {
  Box,
  Paper,
  Stack,
  Button,
  Chip,
  Typography,
  CircularProgress,
  Divider,
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Tooltip, 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';

// --- COMPONENT CON ---
// Component này sẽ tự tải danh sách Skill khi Accordion được mở ra
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

  // Hàm xóa Skill
  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm(`Bạn có chắc muốn xóa Skill ID: ${skillId}? Thao tác này sẽ xóa cả nội dung bên trong.`)) {
      return;
    }
    try {
      await api.Skills.remove(skillId); // Gọi API xóa
      loadSkills(); // Tải lại danh sách
    } catch (e) {
      alert('Xóa thất bại: ' + (e?.message || 'Lỗi không xác định'));
    }
  };

  if (loading) return <CircularProgress size={24} sx={{ mx: 2 }} />;
  if (err) return <Typography color="error.main" sx={{ mx: 2 }}>{err}</Typography>;
  if (skills.length === 0) {
    return <Typography color="text.secondary" sx={{ mx: 2 }}>Không có skill nào.</Typography>;
  }

  return (
    <List dense disablePadding>
      {skills.map((skill) => (
        <ListItem
          key={skill.id}
          divider
          secondaryAction={
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Xem chi tiết (Read-Only)">
                <IconButton component={Link} to={`/admin/skill/${skill.id}`} size="small">
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Sửa nội dung (Editor)">
                <IconButton component={Link} to={`/admin/skill/${skill.id}/edit`} size="small">
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Xóa Skill">
                <IconButton onClick={() => handleDeleteSkill(skill.id)} size="small">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        >
          <ListItemText
            primary={skill.title}
            secondary={`ID: ${skill.id} | Loại: ${skill.type}`}
          />
        </ListItem>
      ))}
    </List>
  );
}
// --- HẾT COMPONENT CON ---


// ===== COMPONENT CHÍNH: TopicDetail =====
export default function TopicDetail() {
  const { id } = useParams(); // ID của Topic

  const [topic, setTopic] = React.useState(null);
  const [lessons, setLessons] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const topicData = await api.Topics.get(id, { ttl: 0 });
        if (cancel) return;
        setTopic(topicData);

        const lessonData = await api.Topics.lessons(id, { page_size: 200 }, { ttl: 0 });
        if (cancel) return;
        setLessons(lessonData || []);
        
      } catch (e) {
        if (cancel) return;
        setErr(e?.message || 'Failed to load topic detail');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  if (loading) return <Box sx={{ p: 2 }}><CircularProgress /></Box>;
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

      {/* Danh sách Lessons (dạng Accordion) */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography fontWeight={700}>
            Danh sách Lessons ({lessons.length})
          </Typography>
          <Button startIcon={<AddIcon />} size="small" variant="contained">
            Thêm Lesson mới (TODO)
          </Button>
        </Stack>
        
        {lessons.length === 0 && (
          <Typography color="text.secondary">Chưa có lesson nào cho topic này.</Typography>
        )}
        
        {lessons.map((lesson) => (
          <Accordion key={lesson.id} TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={500}>{lesson.title}</Typography>
              <Chip label={`Order: ${lesson.order}`} size="small" sx={{ ml: 2 }} />
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {/* Component con tự tải Skills khi được mở */}
              <LessonSkillList lessonId={lesson.id} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
}