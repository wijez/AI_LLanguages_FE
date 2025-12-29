import * as React from "react";
import {
  Box,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { api } from "../../api/api"; 
import ResourceTable from "../components/ResourceTable"; 

export default function WordsPage({ columns }) {

  const [languages, setLanguages] = React.useState([]);
  const [loadingLangs, setLoadingLangs] = React.useState(true);
  const [toast, setToast] = React.useState("");


  React.useEffect(() => {
    api.Languages.list({ page_size: 100 }, { ttl: 5000 })
      .then((data) => {
        // Xử lý cả trường hợp phân trang (data.results) hoặc list phẳng
        const items = data?.results || data || [];
        setLanguages(items);
      })
      .catch((e) => {
        console.error("Failed to load languages", e);
        setToast("Tải danh sách ngôn ngữ thất bại");
      })
      .finally(() => setLoadingLangs(false));
  }, []);


  const languageOptions = React.useMemo(() => {
    return languages.map((lang) => ({
      value: lang.abbreviation, 
      label: `${lang.name} (${lang.abbreviation})`,
    }));
  }, [languages]);

  // Options cho loại từ (Part of Speech)
  const posOptions = [
    { value: "noun", label: "Noun (Danh từ)" },
    { value: "verb", label: "Verb (Động từ)" },
    { value: "adj", label: "Adjective (Tính từ)" },
    { value: "adv", label: "Adverb (Trạng từ)" },
    { value: "pronoun", label: "Pronoun (Đại từ)" },
    { value: "preposition", label: "Preposition (Giới từ)" },
    { value: "conjunction", label: "Conjunction (Liên từ)" },
    { value: "phrase", label: "Phrase (Cụm từ)" },
    { value: "other", label: "Other (Khác)" },
  ];

  // --- 3. Render ---
  
  if (loadingLangs) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ResourceTable
        title="Word Bank"
        resource="/words/"
        columns={columns} // Lấy từ props truyền vào (adminColumns.words)
        
        // --- CẤU HÌNH BỘ LỌC ---
        filters={[
          {
            name: "language", // Param gửi lên API: ?language=ID
            label: "Lọc theo Ngôn ngữ",
            type: "select",
            options: languageOptions,
            minWidth: 200,
          },
          {
            name: "part_of_speech",
            label: "Loại từ",
            type: "select",
            options: posOptions,
            minWidth: 150,
          }
        ]}

        form={[
          { 
            name: "text", 
            label: "Word / Phrase", 
            required: true,
            helperText: "Từ hoặc cụm từ gốc"
          },
          {
            name: "language",
            label: "Language",
            type: "select",        
            options: languageOptions, // Inject danh sách ngôn ngữ
            required: true,
            helperText: "Ngôn ngữ của từ vựng này"
          },
          {
            name: "part_of_speech",
            label: "Part of Speech",
            type: "select",
            options: posOptions,
            required: true,
          },
          { 
            name: "definition", 
            label: "Definition / Meaning", 
            multiline: true, 
            rows: 2,
            helperText: "Định nghĩa hoặc nghĩa tiếng Việt"
          },
          { 
            name: "ipa", 
            label: "IPA (Phiên âm)",
            helperText: "Ví dụ: /həˈləʊ/"
          },
          { 
            name: "audio_url", 
            label: "Audio URL",
            helperText: "Link file âm thanh (nếu có)"
          },
        ]}
      />

      {/* Toast thông báo lỗi nếu tải ngôn ngữ thất bại */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setToast("")}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
}