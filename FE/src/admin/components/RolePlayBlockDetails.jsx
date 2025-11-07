import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Box,
  Paper,
  Stack,
  Button,
  Chip,
  Typography,
  Divider,
  CircularProgress,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import UniversalEditor from "./forms/UniversalEditor";
import { rawJson } from "../../utils/rawJson";

const sectionColors = {
  background: "default",
  instruction: "info",
  dialogue: "primary",
  warmup: "warning",
  vocabulary: "secondary",
};
const roleColors = {
  teacher: "success",
  student_a: "info",
  student_b: "info",
  narrator: "default",
};

// Ẩn thanh cuộn
const SCROLL_INVISIBLE_SX = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": { width: 0, height: 0 },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
  "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
};

// JSON helper
const renderJson = (data) => {
  if (!data) return "N/A";
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

export default function RolePlayBlockDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialScenarioId = location.state?.scenarioId || null;
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  // State cho Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    type: "success",
    msg: "",
  });

  // cấu hình fields cho RolePlayBlock
  const SECTION_OPTIONS = [
    "background",
    "instruction",
    "dialogue",
    "warmup",
    "vocabulary",
  ];
  const ROLE_OPTIONS = ["teacher", "student_a", "student_b", "narrator"];

  const blockFields = [
    {
      name: "section",
      label: "Section",
      type: "select",
      options: SECTION_OPTIONS,
      required: true,
    },
    { name: "role", label: "Role", type: "select", options: ROLE_OPTIONS },
    { name: "lang_hint", label: "Lang Hint", type: "text", nullIfEmpty: true },
    { name: "tts_voice", label: "TTS Voice", type: "text", nullIfEmpty: true },
    { name: "audio_key", label: "Audio Key", type: "text", nullIfEmpty: true },
    { name: "order", label: "Order", type: "number", min: 0, step: 1 },
    { name: "is_active", label: "Active", type: "switch" },
    {
      name: "text",
      label: "Text",
      type: "textarea",
      rows: 4,
      nullIfEmpty: true,
    },
  ];

  const openEditor = () => setEditorOpen(true);
  const closeEditor = () => setEditorOpen(false);
  const showSnack = (type, msg) => setSnack({ open: true, type, msg });
  // state cho rawjson
  const [showRaw, setShowRaw] = useState(false);

  const submitBlockPatch = async (payload) => {
    try {
      setSaving(true);
      const updated = await api.RoleplayBlocks.patch(block.id, payload);
      // merge kết quả (nếu API trả partial)
      setBlock((prev) => ({ ...(prev || {}), ...(updated || payload) }));
      showSnack("success", "Đã lưu thay đổi");
      closeEditor();
    } catch (e) {
      showSnack("error", e?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await api.RoleplayBlocks.get(id, { ttl: 0 });
        if (!cancel) setBlock(data);
      } catch (e) {
        if (!cancel) setErr(e?.message || "Failed to load block");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  const handleDeleteBlock = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa Block ID: ${id}?`)) {
      return;
    }
    try {
      await api.RoleplayBlocks.remove(id);
      navigate(`/admin/roleplay/${initialScenarioId}`);
    } catch (e) {
      setErr("Xóa thất bại: " + (e?.message || "Lỗi không xác định"));
    }
  };

  if (loading)
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  if (err) return <Box sx={{ p: 2, color: "error.main" }}>{err}</Box>;
  if (!block) return <Box sx={{ p: 2 }}>Block not found.</Box>;

  return (
    <>
      <Box sx={{ p: 2, display: "grid", gap: 2 }}>
        <Paper
          sx={{
            p: { xs: 2, md: 3 }, 
            bgcolor: "grey.200",
            borderRadius: 2,
            position: "relative",
            overflow: "visible",
          }}
        >
          <Box
            aria-label="Block Order"
            sx={{
            position: { xs: "static", md: "absolute" },
              mb: { xs: 1, md: 0 },  
              top: -18,
              left: -18,
              width: 54,
              height: 54,
              borderRadius: "999px",
              bgcolor: "#e11d48",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16,
              boxShadow: "0 6px 14px rgba(0,0,0,.18)",
              userSelect: "none",
            }}
            title={`Order: ${block.order ?? "-"}`}
          >
            #{block.order ?? "-"}
          </Box>
          <Box
            sx={{
              position: { xs: "static", md: "absolute" },
              top: -6,
              left: 50,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              px: 1.25,
              py: 0.5,
              borderRadius: 1,
              fontSize: 13,
              boxShadow: "0 6px 14px rgba(0,0,0,.12)",
              display: "flex",
              gap: 1.25,
              fontWeight: 600,
            }}
          >
            <span>Active: {block.is_active ? "Yes" : "No"}</span>
            <span>Order: {block.order ?? "-"}</span>
          </Box>

          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            sx={{ mt: 1 }}
            flexWrap="wrap"
          >
            <Typography component="div" sx={{ fontSize: 13 }}>
              <strong>ID:</strong>{" "}
              <span style={{ wordBreak: "break-all", opacity: 0.9 }}>
                {String(block.id)}
              </span>
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1} /* hoặc spacing={0.75} */
            >
              <Button
                component={Link}
                to={`/admin/roleplay/${initialScenarioId || ""}`}
                variant="outlined"
                size="small"
                sx={{ minWidth: 0, px: 1.25 }}
              >
                Quay lại
              </Button>

              <Button
                onClick={openEditor}
                startIcon={<EditIcon fontSize="small" />}
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: 0, px: 1.25 }}
              >
                Sửa
              </Button>

              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={handleDeleteBlock}
                size="small"
                sx={{ minWidth: 0, px: 1.25 }}
              >
                Xóa
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ mt: 1.25 }}>
            <Typography
              component="div"
              sx={{
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Section :
              <Chip
                size="small"
                label={block.section}
                color={sectionColors[block.section] || "default"}
              />
            </Typography>
            <Typography
              component="div"
              sx={{
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Role :
              <Chip
                size="small"
                label={block.role || "N/A"}
                color={roleColors[block.role] || "default"}
              />
            </Typography>
          </Box>

          {/* Nội dung Text của block */}
          {block.text ? (
            <Typography
              component="div"
              sx={{
                mt: 1,
                p: 1.5,
                bgcolor: "grey.100",
                borderRadius: 1.5,
                whiteSpace: "pre-wrap",
                fontSize: "1rem",
              }}
            >
              {block.text}
            </Typography>
          ) : null}

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                md: 7,
              }}
            >
              <Typography component="div" sx={{ fontWeight: 700, mb: 1 }}>
                Embedding Info
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "120px 1fr" },
                  rowGap: 0.5,
                  columnGap: 1,
                }}
              >
                <Typography component="div" color="text.secondary">
                  Model:
                </Typography>
                <Typography component="div">
                  {block.embedding_model || "N/A"}
                </Typography>
                <Typography component="div" color="text.secondary">
                  Hash:
                </Typography>
                <Typography component="div" sx={{ wordBreak: "break-all" }}>
                  {block.embedding_hash || "N/A"}
                </Typography>
                <Typography component="div" color="text.secondary">
                  Updated:
                </Typography>
                <Typography component="div">
                  {block.embedding_updated_at
                    ? new Date(block.embedding_updated_at).toLocaleString()
                    : "N/A"}
                </Typography>
                <Typography component="div" color="text.secondary">
                  Vector:
                </Typography>
                <Typography component="div">
                  {block.embedding ? "Exists" : "N/A"}
                </Typography>
              </Box>

              {block.embedding_text ? (
                <>
                  <Typography
                    component="div"
                    sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }}
                  >
                    Embedding Text
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 150,
                      overflowY: "auto",
                      ...SCROLL_INVISIBLE_SX,
                      p: 1,
                      bgcolor: "grey.100",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.300",
                    }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        fontSize: 12,
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      }}
                    >
                      {block.embedding_text}
                    </pre>
                  </Box>
                </>
              ) : null}

              {/* Extra JSON (bên trái, dưới embedding) */}
              <Typography
                component="div"
                sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }}
              >
                Extra JSON
              </Typography>
              <Box
                sx={{
                  maxHeight: 180,
                  overflowY: "auto",
                  ...SCROLL_INVISIBLE_SX,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 1,
                  border: "1px solid #eee",
                }}
              >
                <pre style={{ fontSize: 12, margin: 0, padding: 8 }}>
                  {renderJson(block.extra)}
                </pre>
              </Box>
            </Grid>

            {/* Phải: meta + created/updated đặt dưới bên phải */}
            <Grid
              sx={{
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                minHeight: 220,
              }}
              size={{
                xs: 12,
                md: 5,
              }}
            >
              <Box>
                <Typography component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                  TTS / Audio
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    rowGap: 0.5,
                    columnGap: 1,
                  }}
                >
                  <Typography component="div" color="text.secondary">
                    Lang Hint:
                  </Typography>
                  <Typography component="div">
                    {block.lang_hint || "N/A"}
                  </Typography>
                  <Typography component="div" color="text.secondary">
                    TTS Voice:
                  </Typography>
                  <Typography component="div">
                    {block.tts_voice || "N/A"}
                  </Typography>
                  <Typography component="div" color="text.secondary">
                    Audio Key:
                  </Typography>
                  <Typography component="div">
                    {block.audio_key || "N/A"}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  alignSelf: "end",
                  mt: 2,
                  textAlign: { xs: "left", md: "right" },
                }}
              >
                <Typography component="div" sx={{ fontWeight: 600 }}>
                  Created At :{" "}
                  <span style={{ fontWeight: 400 }}>
                    {block.created_at
                      ? new Date(block.created_at).toLocaleString()
                      : "N/A"}
                  </span>
                </Typography>
                <Typography component="div" sx={{ fontWeight: 600 }}>
                  Updated At :{" "}
                  <span style={{ fontWeight: 400 }}>
                    {block.updated_at
                      ? new Date(block.updated_at).toLocaleString()
                      : "N/A"}
                  </span>
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 2, mb: 0.5 }}
          >
            <Typography
              component="div"
              sx={{ fontWeight: 700, cursor: "pointer", userSelect: "none" }}
              onClick={() => setShowRaw((v) => !v)}
              title="Bấm để hiển thị/ẩn Raw JSON"
            >
              Raw JSON (RolePlayBlock)
            </Typography>

            {showRaw && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigator.clipboard.writeText(rawJson(block))}
              >
                Copy JSON
              </Button>
            )}
          </Stack>

          {showRaw && (
            <Box
              sx={{
                maxHeight: { xs: 200, md: 260 },
                overflowY: "auto",
                ...SCROLL_INVISIBLE_SX,
                bgcolor: "#0f172a",
                color: "#e5e7eb",
                p: 1.5,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "grey.800",
              }}
            >
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  fontSize: 12,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                }}
              >
                {rawJson(block)}
              </pre>
            </Box>
          )}
        </Paper>
      </Box>
      <UniversalEditor
        open={editorOpen}
        loading={saving}
        title="Sửa RolePlay Block"
        initialValues={{
          section: block.section || "",
          role: block.role || "",
          lang_hint: block.lang_hint || "",
          tts_voice: block.tts_voice || "",
          audio_key: block.audio_key || "",
          order: Number.isFinite(block.order) ? block.order : 0,
          is_active: !!block.is_active,
          text: block.text || "",
        }}
        fields={blockFields}
        onClose={closeEditor}
        onSubmit={submitBlockPatch}
      />
      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.type}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
