import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/api";
import {
  Box,
  Paper,
  Stack,
  Button,
  Chip,
  Typography,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const TYPE_LABEL = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
  matching: "Matching",
  fillgap: "Fill gap",
  ordering: "Ordering",
  quiz: "Quiz",
  pron: "Pronunciation",
};

function cleanPassageText(str) {
  if (typeof str !== "string" || !str) return "";

  const match = str.match(/{'passage':\s*'(.*)'}/);

  if (match && match[1]) {
    return match[1];
  }

  return str;
}
export default function SkillDetail() {
  const { id } = useParams(); // :id là Skill ID
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [skill, setSkill] = React.useState(null);
  const [lessons, setLessons] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) Skill detail (serializer mới trả nested)
        const rawSkill = await api.Skills.get(id, { ttl: 0 });
        // Chuẩn hoá 1 chút để tiện render
        const normalized = {
          id: rawSkill.id,
          title: rawSkill.title || rawSkill.name || `Skill ${rawSkill.id}`,
          type: rawSkill.type,
          xp_reward: rawSkill.xp_reward ?? 0,
          duration_seconds: rawSkill.duration_seconds ?? 0,
          difficulty: rawSkill.difficulty ?? 1,
          language_code: rawSkill.language_code || "en",
          is_active: !!rawSkill.is_active,
          // nested:
          quiz_questions: rawSkill.quiz_questions || [],
          listening_prompts: rawSkill.listening_prompts || [],
          // reading_content: rawSkill.reading_content || null,
          reading_passage: cleanPassageText(
            rawSkill.reading_content?.passage || ""
          ),
          reading_questions: rawSkill.reading_questions || [],
          writing_questions: rawSkill.writing_questions || [],
          fillgaps: rawSkill.fillgaps || [],
          ordering_items: rawSkill.ordering_items || [],
          matching_pairs: rawSkill.matching_pairs || [],
          pronunciation_prompts: rawSkill.pronunciation_prompts || [],
          speaking_prompts: rawSkill.speaking_prompts || [],
        };
        if (!cancel) setSkill(normalized);

        // 2) Lessons có gắn skill
        const l = await api.Skills.lessons(id, { page_size: 200 }, { ttl: 0 });
        const items = Array.isArray(l?.results)
          ? l.results
          : Array.isArray(l)
          ? l
          : [];
        const lessonsSorted = items
          .map((r) => ({
            id: r.id,
            title: r.title || r.name || `Lesson ${r.id}`,
            order: r.order ?? 0,
            topic:
              typeof r.topic === "object"
                ? r.topic?.title || r.topic?.slug || r.topic?.id
                : r.topic,
          }))
          .sort((a, b) => a.order - b.order || a.id - b.id);
        if (!cancel) setLessons(lessonsSorted);
      } catch (e) {
        if (!cancel) setErr(e?.message || "Failed to load skill detail");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  const gridHeight = mdUp ? 420 : undefined;

  // ====== Render helpers cho phần content theo type ======
  const renderQuiz = (qs) => (
    <DataGrid
      density="compact"
      autoHeight={!mdUp}
      rows={qs}
      getRowId={(r) => r.id}
      columns={[
        { field: "id", headerName: "ID", width: 80 },
        {
          field: "question_text",
          headerName: "Question",
          flex: 1,
          minWidth: 280,
        },
        {
          field: "question_text_i18n",
          headerName: "Question i18n",
          flex: 1.5,
          minWidth: 280,
          renderCell: ({ row }) => {
            const obj = row.question_text_i18n || {};
            const entries = Object.entries(obj);
            if (!entries.length) {
              return (
                <span style={{ fontStyle: "italic", opacity: 0.7 }}>
                  (chưa có i18n)
                </span>
              );
            }
            // Hiển thị dạng: vi: ... \n en: ... \n ko: ...
            return (
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
                {entries.map(([lang, text]) => `${lang}: ${text}`).join("\n")}
              </div>
            );
          },
        },
        {
          field: "choices",
          headerName: "Choices",
          flex: 1.2,
          minWidth: 320,
          renderCell: ({ row }) => {
            const choices = Array.isArray(row.choices) ? row.choices : [];
            return (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap", // cho wrap, phình chiều cao
                  gap: 0.5,
                }}
              >
                {choices.map((c, idx) => (
                  <Chip
                    key={c.id || idx}
                    size="small"
                    label={`${String.fromCharCode(65 + idx)}. ${c.text}${
                      c.is_correct ? " ✅" : ""
                    }`}
                    variant={c.is_correct ? "filled" : "outlined"}
                    sx={{
                      fontSize: 11,
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                ))}
              </Box>
            );
          },
        },
      ]}
      pageSizeOptions={[5, 10, 25]}
      getRowHeight={() => "auto"}
    />
  );

  const renderListening = (ps) => (
    <DataGrid
      density="compact"
      autoHeight={!mdUp}
      rows={ps}
      getRowId={(r) => r.id}
      columns={[
        { field: "id", headerName: "ID", width: 80 },
        {
          field: "question_text",
          headerName: "Prompt",
          flex: 1,
          minWidth: 220,
        },
        { field: "audio_url", headerName: "Audio URL", flex: 1, minWidth: 220 },
        { field: "answer", headerName: "Answer", width: 180 },
      ]}
      pageSizeOptions={[5, 10, 25]}
    />
  );

  const renderReading = (passageText, questions) => (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {passageText && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Passage
          </Typography>
          <Typography whiteSpace="pre-wrap">{passageText}</Typography>
        </Paper>
      )}
      <DataGrid
        density="compact"
        autoHeight
        rows={questions}
        getRowId={(r) => r.id}
        columns={[
          { field: "id", headerName: "ID", width: 80 },
          {
            field: "question_text",
            headerName: "Question",
            flex: 1,
            minWidth: 260,
          },
          { field: "answer", headerName: "Answer", width: 200 },
        ]}
        pageSizeOptions={[5, 10, 25]}
      />
    </Box>
  );

  const renderWriting = (qs) => (
    <DataGrid
      density="compact"
      autoHeight={!mdUp}
      rows={qs}
      getRowId={(r) => r.id}
      columns={[
        { field: "id", headerName: "ID", width: 80 },
        { field: "prompt", headerName: "Prompt", flex: 1, minWidth: 280 },
        { field: "answer", headerName: "Answer", width: 240 },
      ]}
      pageSizeOptions={[5, 10, 25]}
    />
  );

  const renderFillgap = (rows) => (
    <DataGrid
      density="compact"
      autoHeight={!mdUp}
      rows={rows}
      getRowId={(r) => r.id}
      columns={[
        { field: "id", headerName: "ID", width: 80 },
        { field: "text", headerName: "Text", flex: 1, minWidth: 280 },
        { field: "answer", headerName: "Answer", width: 220 },
      ]}
      pageSizeOptions={[5, 10, 25]}
    />
  );

  const renderOrdering = (items) => {
    const sorted = [...items].sort(
      (a, b) => a.order_index - b.order_index || a.id - b.id
    );
    const sentence = sorted.map((i) => i.text).join(" ");
    return (
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Correct order
          </Typography>
          <Typography>{sentence || "—"}</Typography>
        </Paper>
        <DataGrid
          density="compact"
          autoHeight
          rows={sorted}
          getRowId={(r) => r.id}
          columns={[
            { field: "id", headerName: "ID", width: 80 },
            {
              field: "order_index",
              headerName: "Order",
              width: 100,
              type: "number",
            },
            { field: "text", headerName: "Token", flex: 1, minWidth: 260 },
          ]}
          pageSizeOptions={[5, 10, 25]}
        />
      </Box>
    );
  };

  const renderMatching = (pairs) => (
    <DataGrid
      density="compact"
      autoHeight={!mdUp}
      rows={pairs}
      getRowId={(r) => r.id}
      columns={[
        { field: "id", headerName: "ID", width: 80 },
        { field: "left_text", headerName: "Left", flex: 1, minWidth: 220 },
        {
          field: "right_text",
          headerName: "Right (answer)",
          flex: 1,
          minWidth: 220,
        },
      ]}
      pageSizeOptions={[5, 10, 25]}
    />
  );

  const renderPron = (rows) => (
    <DataGrid
      density="compact"
      autoHeight={!mdUp}
      rows={rows}
      getRowId={(r) => r.id}
      columns={[
        { field: "id", headerName: "ID", width: 80 },
        { field: "word", headerName: "Word", width: 160 },
        { field: "phonemes", headerName: "Phonemes", width: 200 },
        { field: "answer", headerName: "Answer", width: 160 },
      ]}
      pageSizeOptions={[5, 10, 25]}
    />
  );

  const renderSpeaking = (rows) => (
    <DataGrid
      density="compact"
      autoHeight={!mdUp}
      rows={rows}
      getRowId={(r) => r.id}
      columns={[
        { field: "id", headerName: "ID", width: 80 },
        { field: "text", headerName: "Prompt", flex: 1, minWidth: 260 },
        { field: "tip", headerName: "Tip", width: 220 },
        { field: "target", headerName: "Target", width: 220 },
      ]}
      pageSizeOptions={[5, 10, 25]}
    />
  );

  // ========== UI ==========
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
      >
        <Box
          component="h2"
          m={0}
          fontSize={22}
          fontWeight={800}
          sx={{ lineHeight: 1.2 }}
        >
          Skill Detail {skill ? `#${skill.id} – ${skill.title}` : ""}
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
          {/* Bạn có thể thêm nút "Chỉnh sửa" ở đây để link sang trang Editor */}
          <Button
            component={Link}
            to={`/admin/skill/${id}/edit`}
            variant="contained"
          >
            Edit Content
          </Button>
          <Button component={Link} to="/admin/skills" variant="outlined">
            Back
          </Button>
        </Stack>
      </Stack>

      {err && <Box color="error.main">{err}</Box>}
      {loading && <Box color="text.secondary">Loading…</Box>}

      {/* Summary */}
      {skill && (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography fontWeight={700} mb={1}>
            Summary
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
                md: "repeat(6, 1fr)",
              },
              gap: 1.2,
            }}
          >
            <div>
              <b>ID:</b> {skill.id}
            </div>
            <div>
              <b>Type:</b> {TYPE_LABEL[skill.type] || skill.type}
            </div>
            <div>
              <b>XP:</b> {skill.xp_reward}
            </div>
            <div>
              <b>Duration:</b> {skill.duration_seconds}s
            </div>
            <div>
              <b>Difficulty:</b> {skill.difficulty}
            </div>
            <div>
              <b>Lang:</b> {skill.language_code}
            </div>
          </Box>
          <Box mt={1}>
            <b>Status:</b> {skill.is_active ? "Active" : "Inactive"}
          </Box>
        </Paper>
      )}

      {/* Two-column: Lessons / Content */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 3fr" },
        }}
      >
        {/* Lessons */}
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography fontWeight={700}>Lessons</Typography>
            <Chip size="small" label={`${lessons.length} items`} />
          </Stack>
          <div style={{ width: "100%", height: gridHeight }}>
            <DataGrid
              density="compact"
              autoHeight={!mdUp}
              rows={lessons}
              getRowId={(r) => r.id}
              columns={[
                { field: "id", headerName: "ID", width: 70 },
                { field: "title", headerName: "Title", flex: 1, minWidth: 160 },
                {
                  field: "order",
                  headerName: "#",
                  width: 60,
                  type: "number",
                },
                { field: "topic", headerName: "Topic", width: 120 },
                {
                  field: "skills_count",
                  headerName: "Skills",
                  width: 80,
                  type: "number",
                },
              ]}
              pageSizeOptions={[5, 10, 25, 50, 100 , 200, 500]}
            />
          </div>
        </Paper>

        {/* Content theo type */}
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography fontWeight={700}>Content</Typography>
            {skill?.type && (
              <Chip size="small" label={TYPE_LABEL[skill.type] || skill.type} />
            )}
          </Stack>

          {!skill && <Typography color="text.secondary">No data</Typography>}

          {!!skill && (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {skill.type === "quiz" && renderQuiz(skill.quiz_questions)}
              {skill.type === "listening" &&
                renderListening(skill.listening_prompts)}
              {skill.type === "reading" &&
                renderReading(skill.reading_passage, skill.reading_questions)}
              {skill.type === "writing" &&
                renderWriting(skill.writing_questions)}
              {skill.type === "fillgap" && renderFillgap(skill.fillgaps)}
              {skill.type === "ordering" &&
                renderOrdering(skill.ordering_items)}
              {skill.type === "matching" &&
                renderMatching(skill.matching_pairs)}
              {skill.type === "pron" && renderPron(skill.pronunciation_prompts)}
              {skill.type === "speaking" &&
                renderSpeaking(skill.speaking_prompts)}

              {/* Nếu không có mục nào khớp (fallback) */}
              {[
                "quiz",
                "listening",
                "reading",
                "writing",
                "fillgap",
                "ordering",
                "matching",
                "pron",
                "speaking",
              ].indexOf(skill.type) < 0 && (
                <Typography color="text.secondary">
                  Unsupported skill type.
                </Typography>
              )}
            </Box>
          )}

          {/* Counters nhanh */}
          {skill && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {skill.quiz_questions?.length > 0 && (
                  <Chip
                    label={`Quiz Qs: ${skill.quiz_questions.length}`}
                    size="small"
                  />
                )}
                {skill.listening_prompts?.length > 0 && (
                  <Chip
                    label={`Listening: ${skill.listening_prompts.length}`}
                    size="small"
                  />
                )}
                {skill.reading_questions?.length > 0 && (
                  <Chip
                    label={`Reading Qs: ${skill.reading_questions.length}`}
                    size="small"
                  />
                )}
                {skill.writing_questions?.length > 0 && (
                  <Chip
                    label={`Writing: ${skill.writing_questions.length}`}
                    size="small"
                  />
                )}
                {skill.fillgaps?.length > 0 && (
                  <Chip
                    label={`Fillgap: ${skill.fillgaps.length}`}
                    size="small"
                  />
                )}
                {skill.ordering_items?.length > 0 && (
                  <Chip
                    label={`Ordering tokens: ${skill.ordering_items.length}`}
                    size="small"
                  />
                )}
                {skill.matching_pairs?.length > 0 && (
                  <Chip
                    label={`Pairs: ${skill.matching_pairs.length}`}
                    size="small"
                  />
                )}
                {skill.pronunciation_prompts?.length > 0 && (
                  <Chip
                    label={`Pron: ${skill.pronunciation_prompts.length}`}
                    size="small"
                  />
                )}
                {skill.speaking_prompts?.length > 0 && (
                  <Chip
                    label={`Speaking: ${skill.speaking_prompts.length}`}
                    size="small"
                  />
                )}
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
