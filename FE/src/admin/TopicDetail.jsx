import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/api';
import {
  Box,
  Paper,
  Stack,
  Button,
  Chip,
  useMediaQuery,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';

export default function TopicDetail() {
  const { id } = useParams();
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  const [topic, setTopic] = React.useState(null);
  const [lessons, setLessons] = React.useState([]);
  const [skills, setSkills] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        // 1) Topic
        const t = await api.Topics.get(id, { ttl: 0 });
        if (!cancel) setTopic(t);

        // 2) Lessons theo topic
        const l = await api.Lessons.list({ topic: id, page_size: 200 }, { ttl: 0 });
        const lItems = Array.isArray(l?.results) ? l.results : (Array.isArray(l) ? l : []);
        lItems.sort((a, b) => (a.order - b.order) || (a.id - b.id));
        if (!cancel) setLessons(lItems);

        // 3) Skills theo topic (KHÔNG dùng topic-skill)
        const s = await api.Skills.list({ topic: id, page_size: 200 }, { ttl: 0 });
        const sItemsRaw = Array.isArray(s?.results) ? s.results : (Array.isArray(s) ? s : []);
        const sItems = sItemsRaw
          .map(r => ({
            id: r.id,
            name: r.name || r.title || `Skill ${r.id}`,
            order: r.order ?? r.position ?? 0,
            slug: r.slug,
          }))
          .sort((a, b) => (a.order - b.order) || (a.id - b.id));
        if (!cancel) setSkills(sItems);
      } catch (e) {
        if (!cancel) setErr(e?.message || 'Failed to load topic detail');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, [id]);

  const gridHeight = mdUp ? 420 : undefined; // mdUp: cố định, mobile: autoHeight

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box component="h2" m={0} fontSize={22} fontWeight={800} sx={{ lineHeight: 1.2 }}>
          Topic Detail {topic ? `#${topic.id} – ${topic.title}` : ''}
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          {topic?.language && (
            <Chip
              label={`Lang: ${typeof topic.language === 'string' ? topic.language : topic.language?.code}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          <Button component={Link} to="/admin/topics" variant="outlined">Back</Button>
        </Stack>
      </Stack>

      {err && <Box color="error.main">{err}</Box>}
      {loading && <Box color="text.secondary">Loading…</Box>}

      {/* Summary */}
      {topic && (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography fontWeight={700} mb={1}>Summary</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 1 }}>
            <div><b>Slug:</b> {topic.slug}</div>
            <div><b>Order:</b> {topic.order}</div>
            <div><b>Golden:</b> {String(topic.golden)}</div>
            <div><b>Language:</b> {typeof topic.language === 'string' ? topic.language : topic.language?.code}</div>
          </Box>
          {topic.description && (
            <Box mt={1}><b>Description:</b> {topic.description}</Box>
          )}
        </Paper>
      )}

      {/* Two-column responsive: Lessons / Skills */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }
        }}
      >
        {/* Lessons */}
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography fontWeight={700}>Lessons</Typography>
            <Chip size="small" label={`${lessons.length} items`} />
          </Stack>

          <div style={{ width: '100%', height: gridHeight }}>
            <DataGrid
              density="compact"
              autoHeight={!mdUp}
              rows={lessons}
              getRowId={(r) => r.id}
              columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'title', headerName: 'Title', flex: 1, minWidth: 220 },
                { field: 'order', headerName: 'Order', width: 100, type: 'number' },
                { field: 'slug', headerName: 'Slug', width: 180 },
              ]}
              pageSizeOptions={[5, 10, 25]}
            />
          </div>
        </Paper>

        {/* Skills */}
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography fontWeight={700}>Skills</Typography>
            <Chip size="small" label={`${skills.length} items`} />
          </Stack>

          <div style={{ width: '100%', height: gridHeight }}>
            <DataGrid
              density="compact"
              autoHeight={!mdUp}
              rows={skills}
              getRowId={(r) => r.id}
              columns={[
                { field: 'id', headerName: 'ID', width: 90 },
                { field: 'name', headerName: 'Name', flex: 1, minWidth: 220 },
                { field: 'order', headerName: 'Order', width: 100, type: 'number' },
                { field: 'slug', headerName: 'Slug', width: 180 },
              ]}
              pageSizeOptions={[5, 10, 25]}
            />
          </div>
        </Paper>
      </Box>
    </Box>
  );
}
