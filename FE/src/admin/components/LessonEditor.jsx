import * as React from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Autocomplete,
  TextField,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AddIcon from "@mui/icons-material/Add";

/**
 * LessonEditor
 * - Hiển thị danh sách Skills trong một Lesson
 * - Cho phép:
 *   + Gắn skill có sẵn vào lesson (attachSkill)
 *   + Gỡ skill khỏi lesson (removeSkill)
 *   + Sắp xếp lại thứ tự skills (reorderSkills: nút lên/xuống)
 *
 * Props:
 *   - lessonId (bắt buộc)
 *   - onChanged? (optional): callback gọi lại sau khi dữ liệu thay đổi
 */
export default function LessonEditor({ lessonId, onChanged }) {
  const [skills, setSkills] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  // Options cho dropdown gắn skill
  const [allSkills, setAllSkills] = React.useState([]);
  const [skillsOptionsLoading, setSkillsOptionsLoading] = React.useState(false);
  const [skillsOptionsLoaded, setSkillsOptionsLoaded] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState(null);

  const [attachLoading, setAttachLoading] = React.useState(false);
  const [reorderLoading, setReorderLoading] = React.useState(false);
  const [removeLoadingId, setRemoveLoadingId] = React.useState(null);

  // ======== Load skills đang có trong lesson ========
  const loadSkills = React.useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await api.Lessons.skills(lessonId, {}, { ttl: 0 });
      setSkills(Array.isArray(data) ? data : []);
      onChanged && onChanged();
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to load skills");
    } finally {
      setLoading(false);
    }
  }, [lessonId, onChanged]);

  React.useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  // ======== Load toàn bộ skill để chọn (gọi khi mở dropdown) ========
  const loadAllSkills = React.useCallback(async () => {
    if (skillsOptionsLoaded || skillsOptionsLoading) return;

    setSkillsOptionsLoading(true);
    try {
      let url = "/skills/";
      let first = true;
      const acc = [];

      while (url) {
        const data = await api.get(
          url,
          first ? {} : undefined,
          { ttl: 0 }
        );
        const items = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];
        acc.push(...items);
        url = data.next || null;
        first = false;
      }

      setAllSkills(acc);
      setSkillsOptionsLoaded(true);
    } catch (e) {
      console.error(e);
      // không alert ở đây để tránh phiền, chỉ log
    } finally {
      setSkillsOptionsLoading(false);
    }
  }, [skillsOptionsLoaded, skillsOptionsLoading]);

  // Options hiển thị = allSkills trừ đi các skill đã có trong lesson
  const attachOptions = React.useMemo(() => {
    if (!allSkills.length) return [];
    const attachedIds = new Set(skills.map((s) => s.id));
    return allSkills.filter((s) => !attachedIds.has(s.id));
  }, [allSkills, skills]);

  // ======== Gắn skill đã chọn vào lesson ========
  const handleAttachSelected = async () => {
    if (!selectedSkill) return;
    try {
      setAttachLoading(true);
      // API mới: /lessons/:id/attach-skill/ { skill: <id> }
      await api.Lessons.attachSkill(lessonId, { skill: selectedSkill.id });
      setSelectedSkill(null);
      await loadSkills();
    } catch (e) {
      console.error(e);
      alert(
        "Gắn skill thất bại: " +
          (e?.response?.data?.detail || e?.message || "Unknown error")
      );
    } finally {
      setAttachLoading(false);
    }
  };

  // ======== Gỡ skill khỏi lesson ========
  const handleRemove = async (skillId) => {
    if (
      !window.confirm(
        `Gỡ Skill ID ${skillId} khỏi Lesson ${lessonId}? (Không xóa skill khỏi hệ thống)`
      )
    ) {
      return;
    }
    try {
      setRemoveLoadingId(skillId);
      // API mới: /lessons/:id/remove-skill/ { skill: <id> }
      await api.Lessons.removeSkill(lessonId, { skill: skillId });
      await loadSkills();
    } catch (e) {
      console.error(e);
      alert(
        "Gỡ skill thất bại: " +
          (e?.response?.data?.detail || e?.message || "Unknown error")
      );
    } finally {
      setRemoveLoadingId(null);
    }
  };

  // ======== Reorder (lên / xuống) ========
  const applyReorder = async (newSkills) => {
    try {
      setReorderLoading(true);
      const items = newSkills.map((s, idx) => ({
        skill: s.id,
        order: idx + 1,
      }));
      // API mới: /lessons/:id/reorder-skills/ { items: [{skill, order}, ...] }
      await api.Lessons.reorderSkills(lessonId, { items });
      setSkills(newSkills);
      onChanged && onChanged();
    } catch (e) {
      console.error(e);
      alert(
        "Cập nhật thứ tự thất bại: " +
          (e?.response?.data?.detail || e?.message || "Unknown error")
      );
    } finally {
      setReorderLoading(false);
    }
  };

  const moveUp = async (skillId) => {
    const idx = skills.findIndex((s) => s.id === skillId);
    if (idx <= 0) return;
    const arr = [...skills];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    await applyReorder(arr);
  };

  const moveDown = async (skillId) => {
    const idx = skills.findIndex((s) => s.id === skillId);
    if (idx === -1 || idx >= skills.length - 1) return;
    const arr = [...skills];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    await applyReorder(arr);
  };

  // ======== UI ========
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (err) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error.main">{err}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header + form gắn skill */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        mb={1.5}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography fontWeight={600}>Skills trong lesson</Typography>
          <Chip label={`${skills.length} items`} size="small" />
          {reorderLoading && (
            <Typography variant="caption" color="text.secondary">
              Đang cập nhật thứ tự...
            </Typography>
          )}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Autocomplete
            size="small"
            sx={{ minWidth: 260 }}
            options={attachOptions}
            loading={skillsOptionsLoading}
            value={selectedSkill}
            onChange={(e, value) => setSelectedSkill(value)}
            // Load toàn bộ skills lần đầu khi mở dropdown
            onOpen={loadAllSkills}
            getOptionLabel={(opt) =>
              opt?.title
                ? `${opt.title} (#${opt.id}) · ${opt.type || ""}`
                : `Skill #${opt?.id || "?"}`
            }
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chọn skill để gắn"
                placeholder="Gõ để lọc theo tên..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {skillsOptionsLoading ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={attachLoading || !selectedSkill}
            onClick={handleAttachSelected}
          >
            {attachLoading ? "Đang gắn..." : "Gắn skill"}
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {skills.length === 0 ? (
        <Typography color="text.secondary">
          Chưa có skill nào trong lesson này.
        </Typography>
      ) : (
        <List dense disablePadding>
          {skills.map((skill, idx) => (
            <ListItem
              key={skill.id}
              divider
              secondaryAction={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {/* Up / Down */}
                  <Tooltip title="Chuyển lên trên">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => moveUp(skill.id)}
                        disabled={reorderLoading || idx === 0}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Chuyển xuống dưới">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => moveDown(skill.id)}
                        disabled={
                          reorderLoading || idx === skills.length - 1
                        }
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {/* View / Edit Skill */}
                  <Tooltip title="Xem chi tiết (Read-Only)">
                    <IconButton
                      component={Link}
                      to={`/admin/skill/${skill.id}`}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sửa nội dung (Editor)">
                    <IconButton
                      component={Link}
                      to={`/admin/skill/${skill.id}/edit`}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  {/* Remove khỏi lesson */}
                  <Tooltip title="Gỡ skill khỏi lesson">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(skill.id)}
                        disabled={removeLoadingId === skill.id}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              }
            >
              <ListItemText
                primary={
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <span>{skill.title}</span>
                    <Chip
                      size="small"
                      label={skill.type}
                      variant="outlined"
                    />
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      ID: {skill.id} · Pos: {idx + 1}
                    </Typography>
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
