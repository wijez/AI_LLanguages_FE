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

export default function SkillDetail() {
  // id là Skill ID (ví dụ: /admin/skills/:id)
  const { id } = useParams();
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  const [skill, setSkill] = React.useState(null);
  const [lessons, setLessons] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        // 1) Skill detail: GET /api/skills/:id/
        const rawSkill = await api.Skills.get(id, { ttl: 0 });
        const normalizedSkill = {
          id: rawSkill.id,
          name: rawSkill.name || rawSkill.title || `Skill ${rawSkill.id}`,
          order: rawSkill.order ?? rawSkill.position ?? 0,
          slug: rawSkill.slug,
          topic: rawSkill.topic,
          description: rawSkill.description,
          ...rawSkill,
        };
        if (!cancel) setSkill(normalizedSkill);

        // 2) Lessons theo skill: GET /api/skills/:id/lessons/
        const l = await api.Skills.lessons(id, { page_size: 200 }, { ttl: 0 });
        const lItemsRaw = Array.isArray(l?.results) ? l.results : (Array.isArray(l) ? l : []);
        const lItems = lItemsRaw
          .map((r) => ({
            id: r.id,
            title: r.title || r.name || `Lesson ${r.id}`,
            order: r.order ?? r.position ?? 0,
            slug: r.slug,
            ...r,
          }))
          .sort((a, b) => (a.order - b.order) || (a.id - b.id));
        if (!cancel) setLessons(lItems);

      } catch (e) {
        if (!cancel) setErr(e?.message || 'Failed to load skill detail');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, [id]);

  const gridHeight = mdUp ? 420 : undefined;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box component="h2" m={0} fontSize={22} fontWeight={800} sx={{ lineHeight: 1.2 }}>
          Skill Detail {skill ? `#${skill.id} – ${skill.name}` : ''}
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          {skill?.topic && (
            <Chip
              label={`Topic: ${
                typeof skill.topic === 'string'
                  ? skill.topic
                  : (skill.topic?.title || skill.topic?.slug || skill.topic?.id || 'N/A')
              }`}
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
      {skill && (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography fontWeight={700} mb={1}>Summary</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 1 }}>
            <div><b>Slug:</b> {skill.slug ?? '—'}</div>
            <div><b>Order:</b> {skill.order}</div>
            <div><b>Topic:</b> {typeof skill.topic === 'string'
              ? skill.topic
              : (skill.topic?.title || skill.topic?.slug || skill.topic?.id || '—')}</div>
            <div><b>ID:</b> {skill.id}</div>
          </Box>
          {skill.description && (
            <Box mt={1}><b>Description:</b> {skill.description}</Box>
          )}
        </Paper>
      )}

      {/* Two-column: Lessons / Skill (single row) */}
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

        {/* Skill (1 row) */}
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography fontWeight={700}>Skill</Typography>
            <Chip size="small" label={`${skill ? 1 : 0} item`} />
          </Stack>

          <div style={{ width: '100%', height: gridHeight }}>
            <DataGrid
              density="compact"
              autoHeight={!mdUp}
              rows={skill ? [skill] : []}
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
