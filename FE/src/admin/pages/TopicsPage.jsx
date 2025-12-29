import * as React from "react";
// 1. Thêm import useNavigate
import { useNavigate } from "react-router-dom";
import {
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Paper,
} from "@mui/material";
import LibraryBooksRounded from "@mui/icons-material/LibraryBooksRounded";
import MilitaryTechRounded from "@mui/icons-material/MilitaryTechRounded";
import { api } from "../../api/api";
import ResourceTable from "../components/ResourceTable";

export default function TopicsPage({ columns }) {
  // 2. Khởi tạo hook điều hướng
  const navigate = useNavigate();

  // --- State cho Logic Custom (Lesson/Skill) ---
  const [openLesson, setOpenLesson] = React.useState(false);
  const [openSkill, setOpenSkill] = React.useState(false);
  const [selectedTopic, setSelectedTopic] = React.useState(null);
  const [lessonForm, setLessonForm] = React.useState({ title: "", order: "" });
  const [skillForm, setSkillForm] = React.useState({ name: "", title: "" });

  // --- State chung ---
  const [toast, setToast] = React.useState("");
  
  // --- State cho Ngôn ngữ (Filter & Dropdown) ---
  const [languages, setLanguages] = React.useState([]);
  const [loadingLangs, setLoadingLangs] = React.useState(true);
  const [selectedLang, setSelectedLang] = React.useState(""); 

  // Tải danh sách ngôn ngữ
  React.useEffect(() => {
    api.Languages.list({ page_size: 100 }, { ttl: 5000 })
      .then((data) => {
        const items = data?.results || data || [];
        setLanguages(items);
      })
      .catch((e) => {
        console.error("Failed to load languages", e);
        setToast("Tải danh sách ngôn ngữ thất bại");
      })
      .finally(() => setLoadingLangs(false));
  }, []);

  const languageOptions = React.useMemo(() => languages.map(l => ({ 
    value: l.abbreviation, label: l.name 
  })), [languages]);

  const resourcePath = React.useMemo(() => {
    if (selectedLang) {
      return `/topics/?lang=${selectedLang}`;
    }
    return "/topics/";
  }, [selectedLang]);

  // --- Logic Custom Actions ---
  const renderActions = ({ selection, reload }) => {
    const firstId = selection?.[0] ?? null;
    return (
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          startIcon={<LibraryBooksRounded />}
          disabled={!firstId}
          onClick={() => {
            setSelectedTopic(firstId);
            setOpenLesson(true);
          }}
        >
          Tạo lesson
        </Button>
        <Button
          variant="contained"
          startIcon={<MilitaryTechRounded />}
          disabled={!firstId}
          onClick={() => {
            setSelectedTopic(firstId);
            setOpenSkill(true);
          }}
        >
          Tạo skill
        </Button>
      </Stack>
    );
  };

  const createLesson = async (reload) => {
    try {
      await api.post("/lessons/", { topic: selectedTopic, ...lessonForm });
      setOpenLesson(false);
      setLessonForm({ title: "", order: "" });
      setToast("Tạo lesson thành công");
      reload?.(); 
    } catch (e) {
      setToast("Tạo lesson thất bại: " + (e?.message || "Lỗi"));
    }
  };

  const createSkill = async (reload) => {
    try {
      await api.post("/skills/", { topic: selectedTopic, ...skillForm });
      setOpenSkill(false);
      setSkillForm({ name: "", title: "" });
      setToast("Tạo skill thành công");
      reload?.();
    } catch (e) {
      setToast("Tạo skill thất bại: " + (e?.message || "Lỗi"));
    }
  };

  const reloadRef = React.useRef(null);
  const headerActionsWithReload = (ctx) => {
    reloadRef.current = ctx.reload;
    return renderActions(ctx);
  };

  return (
    <>
      <Box
        component={Paper}
        variant="outlined"
        elevation={0}
        sx={{ mb: 2, p: 2, borderRadius: 3 }}
      >
        {loadingLangs ? (
          <CircularProgress size={24} />
        ) : (
          <TextField
            select
            label="Lọc theo Ngôn ngữ"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            fullWidth
            sx={{ maxWidth: 300 }}
            size="small"
          >
            <MenuItem value="">
              <em>Hiển thị Tất cả</em>
            </MenuItem>
            {languages.map((lang) => (
              <MenuItem key={lang.id} value={lang.abbreviation}>
                {lang.name} ({lang.abbreviation})
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      <ResourceTable
        key={resourcePath} 
        title="Topics"
        resource={resourcePath}
        columns={columns}
        filters={[
            {
              name: "language",
              label: "Lọc theo Ngôn ngữ",
              options: languageOptions,
              minWidth: 200
            },
            {
               name: "golden",
               label: "Loại Topic",
               options: [{value: 'true', label: 'Golden'}, {value: 'false', label: 'Thường'}]
            }
          ]}
        form={[
          {
            name: "language",
            label: "Language",
            type: "select",
            options: languageOptions,
            required: true,
            helperText: "Chọn ngôn ngữ cho Topic",
          },
          { name: "slug", label: "Slug", required: true },
          { name: "title", label: "Title", required: true },
          { name: "description", label: "Description", multiline: true, rows: 3 },
          { name: "order", label: "Order", type: "number", required: true },
          {
            name: "golden",
            label: "Is Golden Topic?",
            type: "boolean",
          },
        ]}
        headerActions={headerActionsWithReload}
        
        // 3. Kích hoạt nút View bằng cách truyền hàm điều hướng
        onViewRow={(row) => navigate(`/admin/topics/${row.id}`)}
      />

      {/* --- DIALOG TẠO LESSON --- */}
      <Dialog
        open={openLesson}
        onClose={() => setOpenLesson(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Tạo Lesson mới (Topic #{selectedTopic})</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Lesson Title"
              value={lessonForm.title}
              onChange={(e) =>
                setLessonForm((s) => ({ ...s, title: e.target.value }))
              }
              required
              fullWidth
            />
            <TextField
              label="Order"
              type="number"
              value={lessonForm.order}
              onChange={(e) =>
                setLessonForm((s) => ({ ...s, order: e.target.value }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLesson(false)}>Huỷ</Button>
          <Button
            variant="contained"
            onClick={() => createLesson(reloadRef.current)}
          >
            Tạo Lesson
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG TẠO SKILL --- */}
      <Dialog
        open={openSkill}
        onClose={() => setOpenSkill(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Tạo Skill mới (Topic #{selectedTopic})</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Skill Name (Slug)"
              value={skillForm.name}
              onChange={(e) =>
                setSkillForm((s) => ({ ...s, name: e.target.value }))
              }
              required
              fullWidth
              helperText="Tên định danh (không dấu, viết liền)"
            />
            <TextField
              label="Display Title"
              value={skillForm.title}
              onChange={(e) =>
                setSkillForm((s) => ({ ...s, title: e.target.value }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSkill(false)}>Huỷ</Button>
          <Button
            variant="contained"
            onClick={() => createSkill(reloadRef.current)}
          >
            Tạo Skill
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={() => setToast("")} variant="filled">
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
}