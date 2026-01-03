// Import các options nếu cần (đảm bảo đường dẫn đúng)
import { SKILL_TYPE_OPTIONS } from "./skillTypes"; 
import { NOTIFICATION_TYPE_OPTIONS } from "./notificationTypes";

export const resourceConfigs = {
  users: {
    title: "Users",
    resource: "/users/",
    form: [
      { name: "username", label: "Username", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "password", label: "Password", type: "password", required: true },
    ],
  },
  languages: {
    title: "Languages",
    resource: "/languages/",
    form: [
      { name: "name", label: "Name", required: true },
      { name: "abbreviation", label: "Abbreviation", helperText: "e.g. en, vi, ja", required: true },
      { name: "native_name", label: "Native name" },
      { name: "direction", label: "Direction", required: true },
    ],
  },
  roleplay: {
    title: "RolePlay Scenarios",
    resource: "/roleplay-scenario/",
    detailPath: "/admin/roleplay", // Đường dẫn để xem chi tiết
    form: [
        { name: "slug", label: "Slug (Unique ID)", required: true, helperText: "Tự động tạo từ Title nếu để trống" },
        { name: "title", label: "Title", required: true },
        { name: "description", label: "Description", multiline: true, rows: 3 },
        { 
          name: "level", 
          label: "Level", 
          type: "select", 
          required: true,
          options: [
            { value: "A1", label: "A1 - Beginner" },
            { value: "A2", label: "A2 - Elementary" },
            { value: "B1", label: "B1 - Intermediate" },
            { value: "B2", label: "B2 - Upper Intermediate" },
            { value: "C1", label: "C1 - Advanced" },
            { value: "C2", label: "C2 - Proficiency" },
          ] 
        },
        { name: "order", label: "Order", type: "number" },
        { name: "tags", label: "Tags (nhập cách nhau bởi dấu phẩy)" },
        { name: "skill_tags", label: "Skill Tags (nhập cách nhau bởi dấu phẩy)" },
        { name: "is_active", label: "Active", type: "boolean" },
      ],
      // Xử lý dữ liệu trước khi gửi lên API (Tags string -> Array)
      transformPayload: (payload) => {
        if (typeof payload.tags === 'string') {
          payload.tags = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        if (typeof payload.skill_tags === 'string') {
          payload.skill_tags = payload.skill_tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        return payload;
      }
  },
  words: {
    title: "Word Bank",
    resource: "/words/",
    form: [
        { name: "text", label: "Word Text", required: true },
        { 
            name: "language", 
            label: "Language", 
            type: "select", 
            options: [],    
            required: true, 
            helperText: "Chọn ngôn ngữ" 
          },
        { 
          name: "part_of_speech", 
          label: "Part of Speech", 
          type: "select",
          options: [
              { value: "noun", label: "Noun" },
              { value: "verb", label: "Verb" },
              { value: "adj", label: "Adjective" },
              { value: "adv", label: "Adverb" },
              { value: "phrase", label: "Phrase" },
              { value: "other", label: "Other" },
          ]
        },
        { name: "definition", label: "Definition", multiline: true, rows: 2 },
        { name: "ipa", label: "IPA (Pronunciation)" },
        { name: "audio_url", label: "Audio URL" },
      ],
  },
  notifications: {
    title: "Notifications",
    resource: "/notifications/",
    form: [
      { name: "user", label: "User ID", type: "number", required: true },
      { name: "type", label: "Type", type: "select", options: NOTIFICATION_TYPE_OPTIONS, required: true },
      { name: "title", label: "Title" },
      { name: "body", label: "Body", multiline: true, rows: 3 },
      { name: "payload", label: "Payload (JSON)", multiline: true, rows: 2 },
    ],
    // Hàm xử lý dữ liệu trước khi gửi lên API
    transformPayload: (payload) => {
      if (payload.payload) {
        try {
          payload.payload = JSON.parse(payload.payload);
        } catch (e) {
          console.error("Invalid JSON payload", e);
        }
      }
      return payload;
    },
  },
  skills: {
    title: "Skills",
    resource: "/skills/",
    detailPath: "/admin/skill",
    form: [
      { name: "title", label: "Title", required: true },
      { name: "type", label: "Type", type: "select", options: SKILL_TYPE_OPTIONS, required: true },
      { name: "language_code", label: "Language code", required: true },
      { name: "xp_reward", label: "XP", type: "number", required: true },
      { name: "duration_seconds", label: "Duration (s)", type: "number", required: true },
      { name: "difficulty", label: "Difficulty", type: "number" },
      { name: "tags", label: "Tags (CSV)" },
      { name: "is_active", label: "Active", type: "boolean" },
    ],
    transformPayload: (payload) => {
      if (payload.tags && typeof payload.tags === "string") {
        payload.tags = payload.tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
      return payload;
    },
  },
  topics: {
    title: "Topics",
    resource: "/topics/",
    detailPath: "/admin/topics",
    form: [
        { 
            name: "language", 
            label: "Language", 
            type: "select", 
            options: [],    
            required: true, 
            helperText: "Chọn ngôn ngữ" 
          },
      { name: "slug", label: "Slug", required: true },
      { name: "title", label: "Title", required: true },
      { name: "description", label: "Description" },
      { name: "order", label: "Order", type: "number", required: true },
      { name: "golden", label: "Golden", type: "boolean" },
    ],
  },
  recommendations: {
    title: "AI Recommendations",
    resource: "/recommendations/",
    // Recommendations được tạo bởi pipeline, không cho tạo thủ công
  },
  aiModels: {
    title: "AI Model Versions",
    resource: "/ai-models/",
  },
  trainingRuns: {
    title: "Training History",
    resource: "/training-runs/",
  }
};