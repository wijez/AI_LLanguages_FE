import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/api";
import {
  Box,
  Paper,
  Stack,
  Button,
  Typography,
  Divider,
  CircularProgress,
  Grid,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { rawJson } from "../../utils/rawJson";

// ================= Helpers (color hashing & tag legend) =================
const PALETTE = [
  "#0ea5e9",
  "#22c55e",
  "#f43f5e",
  "#f59e0b",
  "#a78bfa",
  "#14b8a6",
  "#60a5fa",
  "#ef4444",
  "#10b981",
  "#fb7185",
  "#06b6d4",
  "#84cc16",
];

const SCROLL_INVISIBLE_SX = {
  scrollbarWidth: "none", // Firefox
  msOverflowStyle: "none", // IE 10+
  "&::-webkit-scrollbar": { width: 0, height: 0 },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
  "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
};
function colorFromLabel(label = "") {
  let h = 0;
  for (let i = 0; i < label.length; i++)
    h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function labelOf(x) {
  if (typeof x === "string") return x;
  if (x && typeof x === "object") return x.name || x.label || String(x);
  return String(x ?? "");
}

// Mỗi tag = ô màu + tên tag; không giới hạn số lượng
function TagLegend({ items }) {
  if (!items || items.length === 0)
    return <Typography variant="caption">N/A</Typography>;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, rowGap: 1.0 }}>
      {items.map((raw, idx) => {
        const t = labelOf(raw);
        const c = colorFromLabel(t);
        return (
          <Box
            key={`${t}-${idx}`}
            sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
          >
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: 0.75,
                bgcolor: c,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)",
              }}
              title={t}
            />
            <Typography variant="body2" sx={{ mr: 0.5 }}>
              {t}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ================= Component =================
export default function RoleplayDetail() {
  const { id } = useParams();
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [showRawScenario, setShowRawScenario] = useState(false);
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await api.RoleplayScenarios.get(id, { ttl: 0 });
        if (!cancel) setScenario(data);
      } catch (e) {
        if (!cancel) setErr(e?.message || "Failed to load scenario detail");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  const sortedBlocks = useMemo(() => {
    if (!scenario?.blocks) return [];
    return [...scenario.blocks].sort((a, b) => a.order - b.order);
  }, [scenario?.blocks]);

  if (loading)
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  if (err) return <Box sx={{ p: 2, color: "error.main" }}>{err}</Box>;
  if (!scenario) return <Box sx={{ p: 2 }}>Scenario not found.</Box>;

  const {
    title,
    slug,
    description,
    level,
    is_active,
    order,
    tags = [],
    skill_tags = [],
    created_at,
    updated_at,
    id: scenId,
    embedding_model,
    embedding_hash,
    embedding_updated_at,
    embedding,
    embedding_text,
  } = scenario;

  return (
    <Box sx={{ display: "flex", right: 0 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          bgcolor: "grey.200",
          borderRadius: 2,
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* Hình tròn Level (Lv) */}
        <Box
          aria-label="Level"
          sx={{
            position: { xs: "static", md: "absolute" },
            top: -18,
            left: -18,
            width: { xs: 44, md: 54 },
            height: { xs: 44, md: 54 },
            mb: { xs: 1, md: 0 },
            borderRadius: "999px",
            bgcolor: "#e11d48",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: { xs: 14, md: 16 },
            boxShadow: "0 6px 14px rgba(0,0,0,.18)",
            userSelect: "none",
          }}
          title={`Level: ${level ?? "-"}`}
        >
          <span style={{ fontWeight: 400 }}>{level ?? "-"}</span>
        </Box>

        {/* Khối Active & Order bên phải Level */}
        <Box
          sx={{
            position: { xs: "static", md: "absolute" },
            top: -6,
            left: 50,
            mt: { xs: 1, md: 0 },
            bgcolor: "primary.main",
            color: "primary.contrastText",
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            fontSize: { xs: 12, md: 13 },
            boxShadow: "0 6px 14px rgba(0,0,0,.12)",
            display: "flex",
            gap: 1.25,
            fontWeight: 600,
            width: "max-content",
          }}
        >
          <span>Active: {is_active ? "Yes" : "No"}</span>
          <span>Order: {order ?? "-"}</span>
        </Box>

        {/* Header: Scenario Details (ID bên phải) */}
        <Stack
          direction="row"
          alignItems="baseline"
          justifyContent="space-between"
          sx={{ mt: 1 }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
            Scenario Details
          </Typography>
          <Typography sx={{ fontSize: 13 }}>
            <strong>ID:</strong>{" "}
            <span style={{ wordBreak: "break-all", opacity: 0.9 }}>
              {String(scenId)}
            </span>
          </Typography>
        </Stack>

        {/* Title & Slug (phía dưới ID) */}
        <Box sx={{ mt: 1.25 }}>
          <Typography sx={{ fontWeight: 600 }}>
            Title : <span style={{ fontWeight: 400 }}>{title}</span>
          </Typography>
          <Typography sx={{ fontWeight: 600 }}>
            Slug : <span style={{ fontWeight: 400 }}>{slug}</span>
          </Typography>
        </Box>

        {description ? (
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            {description}
          </Typography>
        ) : null}

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          {/* Trái: Embedding giữ nguyên */}
          <Grid
            size={{
              xs: 12,
              md: 7,
            }}
          >
            <Typography sx={{ fontWeight: 700, mb: 1 }}>
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
              <Typography color="text.secondary">Model:</Typography>
              <Typography>{embedding_model || "N/A"}</Typography>
              <Typography color="text.secondary">Hash:</Typography>
              <Typography sx={{ wordBreak: "break-all" }}>
                {embedding_hash || "N/A"}
              </Typography>
              <Typography color="text.secondary">Updated:</Typography>
              <Typography>
                {embedding_updated_at
                  ? new Date(embedding_updated_at).toLocaleString()
                  : "N/A"}
              </Typography>
              <Typography color="text.secondary">Vector:</Typography>
              <Typography>{embedding ? "Exists" : "N/A"}</Typography>
            </Box>

            <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }}>
              Embedding Text
            </Typography>
            <Box
              sx={{
                maxHeight: 150,
                overflowY: "auto",
                p: 1,
                ...SCROLL_INVISIBLE_SX,
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
                {embedding_text || ""}
              </pre>
            </Box>
          </Grid>

          {/* Phải: Tags/SkillTags có màu + tên + Created/Updated ở dưới bên phải */}
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
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Tags</Typography>
              <TagLegend items={tags} />
              <Typography sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>
                SkillTags
              </Typography>
              <TagLegend items={skill_tags} />
            </Box>

            <Box
              sx={{
                alignSelf: "end",
                mt: 2,
                textAlign: { xs: "left", md: "right" },
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>
                Create At :{" "}
                <span style={{ fontWeight: 400 }}>
                  {created_at ? new Date(created_at).toLocaleString() : "N/A"}
                </span>
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>
                Update At :{" "}
                <span style={{ fontWeight: 400 }}>
                  {updated_at ? new Date(updated_at).toLocaleString() : "N/A"}
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
            sx={{
            fontSize: 12,
              fontWeight: 50,
              color: "primary.main",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={() => setShowRawScenario((v) => !v)}
          >
            rawJson (RolePlayScenario)
          </Typography>

          {showRawScenario && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigator.clipboard.writeText(rawJson(scenario))}
            >
              Copy JSON
            </Button>
          )}
        </Stack>

        {showRawScenario && (
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
              {rawJson(scenario)}
            </pre>
          </Box>
        )}
      </Paper>
      {/* Danh sách Blocks */}
      <Paper sx={{ p: 2, borderRadius: 2, width: "100%" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
          gap={1}
          flexWrap="wrap"
        >
          <Typography fontWeight={700}>
            Blocks ({sortedBlocks.length})
          </Typography>

          <Button component={Link} to="/admin/roleplay" variant="outlined">
            Quay lại
          </Button>
        </Stack>
        <List
          sx={{
            maxHeight: { xs: 360, md: 600 },
            overflowY: "auto",
            ...SCROLL_INVISIBLE_SX,
          }}
          dense
        >
          {sortedBlocks.map((block) => (
            <ListItemButton
              key={block.id}
              component={Link}
              to={`/admin/roleplay-block/${block.id}`}
              state={{ scenarioId: scenId }}
              divider
            >
              <ListItemText
                primary={
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ overflow: "hidden" }}
                  >
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: 12,
                        fontWeight: 700,
                        bgcolor: "#e5e7eb",
                        color: "#111827",
                      }}
                    >
                      #{block.order}
                    </Box>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: 12,
                        bgcolor: "#dbeafe",
                        color: "#1e40af",
                      }}
                    >
                      {block.section}
                    </Box>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: 12,
                        bgcolor: "#dcfce7",
                        color: "#065f46",
                      }}
                    >
                      {block.role || "-"}
                    </Box>
                    <Typography
                      variant="body2"
                      noWrap
                      title={block.text}
                      sx={{ flex: 1 }}
                    >
                      {block.text}
                    </Typography>
                  </Stack>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
