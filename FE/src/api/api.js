// import axios from "axios";

// const BASE_URL = (() => {
//   const env = import.meta.env.VITE_API_URL?.trim()?.replace(/\/$/, "");
//   if (env) return env;
//   if (typeof window !== "undefined") {
//     return `${window.location.origin.replace(/\/$/, "")}/api`; // dùng cùng origin nếu đã cấu hình proxy /api trên Vercel
//   }
//   throw new Error(
//     "VITE_API_URL is not set and window is undefined (SSR). Set VITE_API_URL in env."
//   );
// })();


// const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 20000);
// const REFRESH_URL = `${BASE_URL.replace(/\/$/, "")}/users/token/refresh/`;

// // Bật log khi: chế độ dev, VITE_DEBUG_API=1, hoặc localStorage.debug_api=1
// const DEBUG =
//   import.meta.env.DEV ||
//   import.meta.env.VITE_DEBUG_API === "1" ||
//   (typeof window !== "undefined" && localStorage.getItem("debug_api") === "1");

// /* =========================================================
//  *  AXIOS INSTANCE
//  * =======================================================*/
// const instance = axios.create({
//   baseURL: BASE_URL,
//   timeout: TIMEOUT,
//   withCredentials: false,
// });

// /* =========================================================
//  *  REQUEST INTERCEPTOR (JWT + i18n + debug log)
//  * =======================================================*/
// instance.interceptors.request.use((cfg) => {
//   cfg.headers = cfg.headers || {};

//   // Chỉ bypass interstitial khi gọi ngrok
//   try {
//     const abs = new URL(cfg.url || "", cfg.baseURL || window.location.origin);
//     const isNgrok = /\.ngrok(?:-free)?\.app$/i.test(abs.host);
//     if (isNgrok) {
//       cfg.headers["ngrok-skip-browser-warning"] = "true";
//     } else {
//       delete cfg.headers["ngrok-skip-browser-warning"];
//     }
//   } catch {
//     // ignore URL parse errors
//   }

//   // JWT
//   const access =
//     typeof window !== "undefined" ? localStorage.getItem("access") : null;
//   if (access) cfg.headers.Authorization = `Bearer ${access}`;
//   else delete cfg.headers.Authorization;

//   // i18n
//   const lng =
//     typeof window !== "undefined" ? localStorage.getItem("lang") : null;
//   if (lng) cfg.headers["Accept-Language"] = lng;
//   else delete cfg.headers["Accept-Language"];

//   if (DEBUG) {
//     const method = (cfg.method || "get").toUpperCase();
//     console.groupCollapsed(
//       `%c[API] → ${method} ${cfg.baseURL || ""}${cfg.url || ""}`,
//       "color:#3b82f6;font-weight:700"
//     );
//     console.log("Headers:", cfg.headers);
//     console.log("Params :", cfg.params);
//     console.log("Data   :", cfg.data);
//     console.groupEnd();
//   }
//   return cfg;
// });

// /* =========================================================
//  *  REFRESH TOKEN HELPER
//  * =======================================================*/
// let refreshing = null;

// async function refreshAccessToken() {
//   if (refreshing) return refreshing;

//   const refresh =
//     typeof window !== "undefined" ? localStorage.getItem("refresh") : null;
//   if (!refresh) throw new Error("NO_REFRESH_TOKEN");

//   refreshing = axios
//     .post(
//       REFRESH_URL,
//        { refresh },
//        {
//         headers: {
//           "ngrok-skip-browser-warning": "true",
//           "Content-Type": "application/json",
//         },
//       }

//     )
//     .then(({ data }) => {
//       const token = data?.access || data?.access_token;
//       if (!token) throw new Error("NO_ACCESS_IN_REFRESH_RESPONSE");
//       if (typeof window !== "undefined") {
//         // đảm bảo đồng bộ key
//         localStorage.setItem("access", token);
//         if (data?.refresh) localStorage.setItem("refresh", data.refresh);
//       }
//       instance.defaults.headers.common.Authorization = `Bearer ${token}`;
//       return token;
//     })
//     .finally(() => {
//       refreshing = null;
//     });

//   return refreshing;
// }


// instance.interceptors.response.use(
//   (res) => {
//     if (DEBUG) {
//       console.groupCollapsed(
//         `%c[API] ← ${res.status} ${res.config?.url}`,
//         "color:#10b981;font-weight:700"
//       );
//       console.log("Data:", res.data);
//       console.groupEnd();
//     }
//     return res;
//   },
//   async (err) => {
//     const { config, response } = err || {};
//     const status = response?.status;
//     const reqUrl = response?.config?.url || config?.url || "";

//     if (DEBUG) {
//       console.group("%c[API ERROR]", "color:#ef4444;font-weight:700");
//       console.error(err);
//       if (response) {
//         console.log("Status :", status);
//         console.log("URL    :", reqUrl);
//         console.log("Params :", response.config?.params);
//         console.log("Data   :", response.data);
//       }
//       console.groupEnd();
//     }

//     // Tránh lặp khi chính call refresh bị 401
//     const isRefreshCall = (reqUrl || "").includes("/users/token/refresh/");

//     // Auto refresh 1 lần khi 401 (trừ refresh endpoint)
//     if (status === 401 && !config?.__isRetry && !isRefreshCall) {
//       try {
//         const newAccess = await refreshAccessToken();
//         const retryCfg = { ...config, __isRetry: true };
//         retryCfg.headers = {
//           ...(retryCfg.headers || {}),
//           Authorization: `Bearer ${newAccess}`,
//         };
//         return instance(retryCfg);
//       } catch (e) {
//         const s = e?.response?.status;
//         if (s === 400 || s === 401) {
//           if (typeof window !== "undefined") {
//             localStorage.removeItem("access");
//             localStorage.removeItem("refresh");
//           }
//         }
//         throw e;
//       }
//     }

//     throw err;
//   }
// );
// /* =========================================================
//  *  TIỆN ÍCH CƠ BẢN
//  * =======================================================*/
// const ensureSlash = (s) => (s.endsWith("/") ? s : `${s}/`);
// const joinPath = (a, b = "") =>
//   ensureSlash(a) + (b.startsWith("/") ? b.slice(1) : b);
// const unwrap = (res) => res?.data;

// /* =========================================================
//  *  CACHE GET + DE-DUPE
//  * =======================================================*/
// const inflight = new Map(); // key -> Promise
// const cache = new Map(); // key -> { expiry, data }

// const keyOf = (method, url, params) =>
//   `${method}:${url}?${
//     params ? JSON.stringify(params, Object.keys(params).sort()) : ""
//   }`;

// async function getCached(url, config = {}, { ttl = 5000, dedupe = true } = {}) {
//   const key = keyOf("GET", url, config?.params);
//   const now = Date.now();

//   const hit = cache.get(key);
//   if (hit && hit.expiry > now) return hit.data;

//   if (dedupe && inflight.has(key)) return inflight.get(key);

//   const req = instance
//     .get(url, config)
//     .then((res) => {
//       cache.set(key, { expiry: now + ttl, data: res });
//       inflight.delete(key);
//       return res;
//     })
//     .catch((e) => {
//       inflight.delete(key);
//       throw e;
//     });

//   inflight.set(key, req);
//   return req;
// }

// function invalidateAll() {
//   cache.clear();
// }

// /* =========================================================
//  *  CRUD FACTORY (DRF-style)
//  * =======================================================*/
// function crud(resourceBase) {
//   const base = ensureSlash(resourceBase);
//   return {
//     list: (params, opts) => getCached(base, { params }, opts).then(unwrap),
//     get: (id, opts) =>
//       getCached(joinPath(base, `${id}/`), {}, opts).then(unwrap),
//     create: (payload, cfg) =>
//       instance.post(base, payload, cfg).then(unwrap).finally(invalidateAll),
//     update: (id, payload, cfg) =>
//       instance
//         .put(joinPath(base, `${id}/`), payload, cfg)
//         .then(unwrap)
//         .finally(invalidateAll),
//     patch: (id, payload, cfg) =>
//       instance
//         .patch(joinPath(base, `${id}/`), payload, cfg)
//         .then(unwrap)
//         .finally(invalidateAll),
//     remove: (id, cfg) =>
//       instance
//         .delete(joinPath(base, `${id}/`), cfg)
//         .then(unwrap)
//         .finally(invalidateAll),
//   };
// }

// /* =========================================================
//  *  SCOPE TỰ DO (endpoint không theo CRUD)
//  * =======================================================*/
// function scope(prefix) {
//   const base = ensureSlash(prefix);
//   return {
//     get: (p = "", cfg, opts) =>
//       getCached(joinPath(base, p), cfg, opts).then(unwrap),
//     post: (p = "", data, cfg) =>
//       instance.post(joinPath(base, p), data, cfg).then(unwrap),
//     put: (p = "", data, cfg) =>
//       instance.put(joinPath(base, p), data, cfg).then(unwrap),
//     patch: (p = "", data, cfg) =>
//       instance.patch(joinPath(base, p), data, cfg).then(unwrap),
//     delete: (p = "", cfg) =>
//       instance.delete(joinPath(base, p), cfg).then(unwrap),
//   };
// }

// /* =========================================================
//  *  RESOURCES THEO Django DefaultRouter
//  * =======================================================*/
// const Resources = {
//   // Users
//   Users: crud("/users/"),
//   AccountSettings: crud("/settings/"),
//   SwitchAccount: crud("/switchaccount/"),

//   // Language
//   Languages: crud("/languages/"),
//   Enrollments: crud("/enrollments/"),
//   Lessons: crud("/lessons/"),
//   Topics: crud("/topics/"),
//   TopicSkills: crud("/topic-skill/"),
//   TopicProgress: crud("/progress/"),
//   Skills: crud("/skills/"),
//   UserSkillStats: crud("/user-skill-stats/"),
//   SkillStats: crud("/skill-stats/"),
//   RoleplayScenarios: crud("/roleplay-scenario/"),
//   RoleplayBlocks: crud("/roleplay-block/"),
//   // Vocabulary
//   AudioAssets: crud("/audio-assets/"),
//   KnownWords: crud("/known-words/"),
//   Translations: crud("/translations/"),
//   Words: crud("/words/"),
//   WordRelations: crud("/word-relations/"),
//   Mistake: crud("/mistake/"),
//   LearningInteraction: crud("/learning-interaction/"),

//   // Progress
//   DailyXP: crud("/daily-xp/"),

//   // Social
//   Friends: crud("/friends/"),
//   CalendarEvents: crud("/calendar-events/"),
//   LeaderboardEntries: crud("/leaderboard-entries/"),
//   Notifications: crud("/notifications/"),

//   // Badges
//   Badges: crud("/badges/"),
//   MyBadges: crud("/my-badges/"),
//   Practice: {
//     overview: (params = {}, cfg) =>
//       instance
//         .get(`/practice/overview`, { params, ...(cfg || {}) })
//         .then(unwrap),
//   },
//   PronunciationPrompts: crud("/pronunciation-prompts/"),
// };


// const UsersApp = scope("/users/");
// const Chat = scope("/chat/");
// const Pron = scope("/pron/");
// const Speech = scope("/");

// const SpeechPron = {
//   up: (formData, cfg) =>
//     instance.post("/speech/pron/up/", formData, cfg).then(unwrap),
//   // nếu cần gọi TTS dạng GET:
//   tts: ({ text, lang }) =>
//     getCached(
//       "/speech/tts",
//       { params: { text, lang } },
//       { ttl: 0 } 
//     ).then(unwrap),
//   ttsPrompt: (promptId, lang, cfg) =>
//     instance
//       .post("/speech/pron/tts/", { prompt_id: promptId, lang }, cfg)
//       .then(unwrap),
//   stt: (data, cfg) => instance.post("/speech/stt/", data, cfg).then(unwrap),
// };

// // Roleplay session flows
// const RoleplaySession = {
//   start: (payload, cfg) =>
//     instance.post("/roleplay-session/start/", payload, cfg).then(unwrap),
//   submit: (payload, cfg) =>
//     instance.post("/roleplay-session/submit/", payload, cfg).then(unwrap),
//   practic: (payload, cfg) =>
//     instance.post("/roleplay-session/practice/", payload, cfg).then(unwrap),
//   startPractice: (payload, cfg) =>
//     instance.post("/roleplay-session/start-practice/", payload, cfg).then(unwrap),
//   submitPractice: (payload, cfg) =>
//     instance.post("/roleplay-session/submit-practice/", payload, cfg).then(unwrap),
//   history: (params, cfg) => 
//     instance.get("/roleplay-session/history/", { params, ...cfg }).then(unwrap),
//   resume: (id, cfg) => 
//     instance.get(`/roleplay-session/${id}/resume/`, cfg).then(unwrap),
// };

// Resources.RoleplayBlocks = {
//   ...Resources.RoleplayBlocks,
//   patch: (id, payload, cfg) =>
//     instance
//       .patch(`/roleplay-block/${id}/`, payload, cfg)
//       .then(unwrap),

//   askGemini: (payload, cfg) =>
//     instance
//       .post("/roleplay-block/ask_gemini/", payload, cfg)
//       .then(unwrap),
// };

// /* =========================================================
//  *  TOOLS / UTILITIES
//  * =======================================================*/
// async function exportChatTraining() {
//   const url = "/export/chat_training.jsonl";
//   const res = await instance.get(url, { responseType: "blob" });
//   return res.data; // Blob
// }

// /* =========================================================
//  *  EXTEND: Lessons
//  * =======================================================*/
// Resources.Lessons = {
//   ...Resources.Lessons,

//   // GET /api/lessons/:id/skills/
//   skills: (lessonId, params = {}, opts) =>
//     getCached(`/lessons/${lessonId}/skills/`, { params }, opts).then(unwrap),

//   // POST /api/lessons/:id/add-skill/
//   addSkill: (lessonId, payload, cfg) =>
//     instance
//       .post(`/lessons/${lessonId}/add-skill/`, payload, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),
//   // Gắn skill đã tồn tại vào lesson
//   attachSkill: (lessonId, payload, cfg) =>
//     instance
//       .post(`/lessons/${lessonId}/attach-skill/`, payload, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),

//   // Gỡ skill khỏi lesson
//   removeSkill: (lessonId, payload, cfg) =>
//     instance
//       .post(`/lessons/${lessonId}/remove-skill/`, payload, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),

//   // Cập nhật order của các skill trong lesson
//   reorderSkills: (lessonId, payload, cfg) =>
//     instance
//       .post(`/lessons/${lessonId}/reorder-skills/`, payload, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),
// };

// /* =========================================================
//  *  EXTEND: Skills
//  * =======================================================*/
// Resources.Skills = {
//   ...Resources.Skills,

//   // GET /api/skills/:id/questions/
//   questions: (skillId, params = {}, opts) =>
//     getCached(`/skills/${skillId}/questions/`, { params }, opts).then(unwrap),

//   // POST /api/skills/:id/upsert-questions/
//   upsertQuestions: (skillId, payload, cfg) =>
//     instance
//       .post(`/skills/${skillId}/upsert-questions/`, payload, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),

//   lessons: (skillId, params = {}, opts) =>
//     getCached(`/skills/${skillId}/lessons/`, { params }, opts).then(unwrap),

//   // GET skill theo lesson (ưu tiên subroute; fallback query param)
//   byLesson: async ({ lesson, ...params } = {}, opts) => {
//     try {
//       return await getCached(
//         `/lessons/${lesson}/skills/`,
//         { params },
//         opts
//       ).then(unwrap);
//     } catch {
//       return getCached(
//         "/skills/",
//         { params: { lesson, ...params } },
//         opts
//       ).then(unwrap);
//     }
//   },
// };


// Resources.Friends = {
//   ...Resources.Friends,
//   accept: (id, payload = {}, cfg) =>
//     instance
//       .post(`/friends/${id}/accept/`, payload, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),

//   // POST /api/friends/:id/cancel/
//   cancel: (id, payload = {}, cfg) =>
//     instance
//       .post(`/friends/${id}/cancel/`, payload, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),
// }

// /* =========================================================
//  *  EXTEND: Topics
//  * =======================================================*/
// Resources.Topics = {
//   ...Resources.Topics,

//   // GET /api/topics/by-language/?language_abbr=...&language_id=...&page_size=...
//   byLanguage: (params = {}, opts) =>
//     getCached("/topics/by-language/", { params }, opts).then(unwrap),

//   // GET /api/topics/:topicId/lessons/
//   lessons: (topicId, params = {}, opts) =>
//     getCached(`/topics/${topicId}/lessons/`, { params }, opts).then(unwrap),

//   // GET /api/topics/:topicId/skills/
//   skills: (topicId, params = {}, opts) =>
//     getCached(`/topics/${topicId}/skills/`, { params }, opts).then(unwrap),

//   createLesson: (id, data, opts) =>
//     api.post(`/topics/${id}/lessons/`, data, opts).then(unwrap),
// };

// /* =========================================================
//  *  EXTEND: LearningSessions
//  * =======================================================*/
// Resources.LearningSessions = {
//   ...crud("/learning/sessions/"),

//   list: (params, opts) =>
//     getCached("/learning/sessions/", { params }, opts).then(unwrap),

//   // GET /api/learning/sessions/:id/
//   get: (id, opts) =>
//     getCached(`/learning/sessions/${id}/`, {}, opts).then(unwrap),

//   // POST /api/learning/sessions/start/
//   start: (payload, cfg) =>
//     instance.post("/learning/sessions/start/", payload, cfg).then(unwrap),

//   // POST /api/learning/sessions/:id/answer/
//   answer: (id, payload, cfg) =>
//     instance
//       .post(`/learning/sessions/${id}/answer/`, payload, cfg)
//       .then(unwrap),

//   // POST /api/learning/sessions/:id/complete/
//   complete: (id, payload, cfg) =>
//     instance
//       .post(`/learning/sessions/${id}/complete/`, payload, cfg)
//       .then(unwrap),

//   // POST /api/learning/sessions/:id/cancel/
//   cancel: (id, payload, cfg) =>
//     instance
//       .post(`/learning/sessions/${id}/cancel/`, payload, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),
// };

// /* =========================================================
//  *  SkillSessions (theo Skill, phục vụ PronAttempt history)
//  * =======================================================*/
// Resources.SkillSessions = {
//   ...crud("/skill_sessions/"),

//   // POST /api/skill_sessions/start/
//   start: (payload, cfg) =>
//     instance.post("/skill_sessions/start/", payload, cfg).then(unwrap),

//   // POST /api/skill_sessions/:id/complete/
//   complete: (id, payload = {}, cfg) =>
//     instance.post(`/skill_sessions/${id}/complete/`, payload, cfg).then(unwrap),

//   // POST /api/skill_sessions/:id/cancel/
//   cancel: (id, payload = {}, cfg) =>
//     instance.post(`/skill_sessions/${id}/cancel/`, payload, cfg).then(unwrap),

//   // GET /api/skill_sessions/:id/attempts/
//   attempts: (id, params = {}, opts) =>
//     getCached(`/skill_sessions/${id}/attempts/`, { params }, opts).then(unwrap),
//   saveAttempt: (id, payload, cfg) =>
//     instance.post(`/skill_sessions/${id}/save_attempt/`, payload, cfg).then(unwrap),
// };

// /* =========================================================
//  *  EXTEND: Enrollments
//  * =======================================================*/
// Resources.Enrollments = {
//   ...Resources.Enrollments,

//   me: (params = {}, opts) =>
//     getCached("/enrollments/me/", { params }, opts).then(unwrap),

//   // POST /api/enrollments/ { abbreviation:'zh', ... } → tạo enrollment bằng abbr
//   createByAbbr: (abbr, payload = {}, cfg) =>
//     instance
//       .post("/enrollments/", { abbreviation: abbr, ...payload }, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),

//   findByAbbr: (abbr, opts) =>
//     getCached("/enrollments/", { params: { abbreviation: abbr } }, opts).then(
//       unwrap
//     ),
//   findByLangCode: (code, opts) =>
//     getCached("/enrollments/", { params: { language_code: code } }, opts).then(
//       unwrap
//     ),
//   findByCodeAlias: (code, opts) =>
//     getCached("/enrollments/", { params: { code } }, opts).then(unwrap),
// };
// /* =========================================================
//  *  EXTEND: Users
//  * =======================================================*/
// Resources.Users = {
//   ...Resources.Users,

//   // GET /api/users/me/
//   me: (params = {}, opts) =>
//     getCached("/users/me/", { params }, opts).then(unwrap),

//   // PATCH /api/users/me/
//   updateMe: (payload, cfg) =>
//     instance
//       .patch("/users/me/", payload, cfg)
//       .then(unwrap)
//       .finally(invalidateAll),
// };

// Resources.Notifications ={
//   ...Resources.Notifications,
//   read: (id, data = {}, opts) =>
//     api.patch(`/notifications/${id}/read/`, data, opts).then(unwrap),
//   markAllRead: (opts) =>
//     api.patch(`/notifications/read-all/`, null, opts).then(unwrap),
// }
// /* =========================================================
//  *  EXTEND: Mistakes
//  * =======================================================*/
// Resources.Mistakes = {
//   ...crud("/mistake/"),
//   bySkill: (skillId, params, opts) =>
//     getCached(
//       "/mistake/",
//       { params: { skill: skillId, ordering: "-timestamp", ...params } },
//       opts
//     ).then(unwrap),
// };

// /* =========================================================
//  *  EXPORT API
//  * =======================================================*/
// export const api = {
//   instance,
//   baseURL: BASE_URL,

//   // gọi tự do
//   get: (url, cfg, opts) => getCached(url, cfg, opts).then(unwrap),
//   post: (url, data, cfg) => instance.post(url, data, cfg).then(unwrap),
//   put: (url, data, cfg) => instance.put(url, data, cfg).then(unwrap),
//   patch: (url, data, cfg) => instance.patch(url, data, cfg).then(unwrap),
//   delete: (url, cfg) => instance.delete(url, cfg).then(unwrap),

//   // nhóm CRUD theo router
//   ...Resources,

//   // scopes app con
//   UsersApp,
//   Chat,
//   Pron,
//   Speech,
//   SpeechPron,
//   RoleplaySession,

//   // tools
//   exportChatTraining,

//   // tiện ích
//   invalidateAll,
//   refreshToken: refreshAccessToken,
// };

// export default api;
import { createApiClient, invalidateAllCache } from "./api-core";

// --- CONFIG ---
const BASE_URL = (() => {
  const env = import.meta.env.VITE_API_URL?.trim()?.replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/$/, "")}/api`;
  }
  return "";
})();

const REFRESH_URL = `${BASE_URL}/users/token/refresh/`;

// --- INIT CLIENT ---
const client = createApiClient({
  baseURL: BASE_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT || 20000,
  refreshUrl: REFRESH_URL,
  debugPrefix: "API",
});

// Helper destructuring
const { createCrud, createScope, unwrap } = client;

// --- RESOURCES DEFINITION ---
const Resources = {
  // Users & Auth
  Users: createCrud("/users/"),
  AccountSettings: createCrud("/settings/"),
  SwitchAccount: createCrud("/switchaccount/"),

  // Language & Content
  Languages: createCrud("/languages/"),
  Enrollments: createCrud("/enrollments/"),
  Lessons: createCrud("/lessons/"),
  Topics: createCrud("/topics/"),
  TopicSkills: createCrud("/topic-skill/"),
  TopicProgress: createCrud("/progress/"),
  Skills: createCrud("/skills/"),
  UserSkillStats: createCrud("/user-skill-stats/"),
  SkillStats: createCrud("/skill-stats/"),
  
  // Vocabulary
  AudioAssets: createCrud("/audio-assets/"),
  KnownWords: createCrud("/known-words/"),
  Translations: createCrud("/translations/"),
  Words: createCrud("/words/"),
  WordRelations: createCrud("/word-relations/"),
  
  // Interactions
  Mistake: createCrud("/mistake/"),
  LearningInteraction: createCrud("/learning-interaction/"),
  DailyXP: createCrud("/daily-xp/"),

  // Social & Gamification
  Friends: createCrud("/friends/"),
  CalendarEvents: createCrud("/calendar-events/"),
  LeaderboardEntries: createCrud("/leaderboard-entries/"),
  Notifications: createCrud("/notifications/"),
  Badges: createCrud("/badges/"),
  MyBadges: createCrud("/my-badges/"),

  // Specific Features
  RoleplayScenarios: createCrud("/roleplay-scenario/"),
  RoleplayBlocks: createCrud("/roleplay-block/"),
  PronunciationPrompts: createCrud("/pronunciation-prompts/"),

  // Custom Endpoint (Not standard CRUD)
  Practice: {
    overview: (params = {}, cfg) => client.get(`/practice/overview`, { params, ...(cfg || {}) }),
  },
};

// --- EXTENDED LOGIC (CUSTOM METHODS) ---

// 1. LESSONS EXTENSIONS
Resources.Lessons = {
  ...Resources.Lessons,
  skills: (id, params, opts) => client.get(`/lessons/${id}/skills/`, { params }, opts),
  addSkill: (id, payload, cfg) => client.post(`/lessons/${id}/add-skill/`, payload, cfg).finally(invalidateAllCache),
  attachSkill: (id, payload, cfg) => client.post(`/lessons/${id}/attach-skill/`, payload, cfg).finally(invalidateAllCache),
  removeSkill: (id, payload, cfg) => client.post(`/lessons/${id}/remove-skill/`, payload, cfg).finally(invalidateAllCache),
  reorderSkills: (id, payload, cfg) => client.post(`/lessons/${id}/reorder-skills/`, payload, cfg).finally(invalidateAllCache),
};

// 2. SKILLS EXTENSIONS
Resources.Skills = {
  ...Resources.Skills,
  questions: (id, params, opts) => client.get(`/skills/${id}/questions/`, { params }, opts),
  upsertQuestions: (id, payload, cfg) => client.post(`/skills/${id}/upsert-questions/`, payload, cfg).finally(invalidateAllCache),
  lessons: (id, params, opts) => client.get(`/skills/${id}/lessons/`, { params }, opts),
  byLesson: async ({ lesson, ...params } = {}, opts) => {
    try {
      return await client.get(`/lessons/${lesson}/skills/`, { params }, opts);
    } catch {
      return client.get("/skills/", { params: { lesson, ...params } }, opts);
    }
  },
};

// 3. USERS EXTENSIONS
Resources.Users = {
  ...Resources.Users,
  me: (params, opts) => client.get("/users/me/", { params }, opts),
  updateMe: (payload, cfg) => client.patch("/users/me/", payload, cfg).finally(invalidateAllCache),
};

// 4. TOPICS EXTENSIONS
Resources.Topics = {
  ...Resources.Topics,
  byLanguage: (params, opts) => client.get("/topics/by-language/", { params }, opts),
  lessons: (id, params, opts) => client.get(`/topics/${id}/lessons/`, { params }, opts),
  skills: (id, params, opts) => client.get(`/topics/${id}/skills/`, { params }, opts),
  createLesson: (id, data, opts) => client.post(`/topics/${id}/lessons/`, data, opts),
};

// 5. ENROLLMENTS EXTENSIONS
Resources.Enrollments = {
  ...Resources.Enrollments,
  me: (params, opts) => client.get("/enrollments/me/", { params }, opts),
  createByAbbr: (abbr, payload, cfg) => client.post("/enrollments/", { abbreviation: abbr, ...payload }, cfg).finally(invalidateAllCache),
  findByAbbr: (abbr, opts) => client.get("/enrollments/", { params: { abbreviation: abbr } }, opts),
  findByLangCode: (code, opts) => client.get("/enrollments/", { params: { language_code: code } }, opts),
  findByCodeAlias: (code, opts) => client.get("/enrollments/", { params: { code } }, opts),
};

// 6. FRIENDS EXTENSIONS
Resources.Friends = {
    ...Resources.Friends,
    accept: (id, payload, cfg) => client.post(`/friends/${id}/accept/`, payload || {}, cfg).finally(invalidateAllCache),
    cancel: (id, payload, cfg) => client.post(`/friends/${id}/cancel/`, payload || {}, cfg).finally(invalidateAllCache),
};

// 7. NOTIFICATIONS EXTENSIONS
Resources.Notifications = {
    ...Resources.Notifications,
    read: (id, data, opts) => client.patch(`/notifications/${id}/read/`, data || {}, opts),
    markAllRead: (opts) => client.patch(`/notifications/read-all/`, null, opts),
};

// 8. MISTAKES EXTENSIONS
Resources.Mistakes = {
    ...Resources.Mistake, // Use the basic crud
    bySkill: (skillId, params, opts) => client.get("/mistake/", { params: { skill: skillId, ordering: "-timestamp", ...params } }, opts),
};

// 9. ROLEPLAY BLOCKS EXTENSIONS
Resources.RoleplayBlocks = {
    ...Resources.RoleplayBlocks,
    askGemini: (payload, cfg) => client.post("/roleplay-block/ask_gemini/", payload, cfg),
};

// --- SCOPES & CUSTOM OBJECTS ---

const UsersApp = createScope("/users/");
const Chat = createScope("/chat/");
const Pron = createScope("/pron/");
const Speech = createScope("/");

// Learning Sessions (Complex Logic)
const LearningSessions = {
    ...createCrud("/learning/sessions/"),
    start: (payload, cfg) => client.post("/learning/sessions/start/", payload, cfg),
    answer: (id, payload, cfg) => client.post(`/learning/sessions/${id}/answer/`, payload, cfg),
    complete: (id, payload, cfg) => client.post(`/learning/sessions/${id}/complete/`, payload, cfg),
    cancel: (id, payload, cfg) => client.post(`/learning/sessions/${id}/cancel/`, payload, cfg).finally(invalidateAllCache),
    resume: (id) => client.post(`/learning/sessions/${id}/resume/`),
};

// Skill Sessions
const SkillSessions = {
    ...createCrud("/skill_sessions/"),
    start: (payload, cfg) => client.post("/skill_sessions/start/", payload, cfg),
    complete: (id, payload, cfg) => client.post(`/skill_sessions/${id}/complete/`, payload || {}, cfg),
    cancel: (id, payload, cfg) => client.post(`/skill_sessions/${id}/cancel/`, payload || {}, cfg),
    attempts: (id, params, opts) => client.get(`/skill_sessions/${id}/attempts/`, { params }, opts),
    saveAttempt: (id, payload, cfg) => client.post(`/skill_sessions/${id}/save_attempt/`, payload, cfg),
};

// Speech & Pron
const SpeechPron = {
  up: (formData, cfg) => client.post("/speech/pron/up/", formData, cfg),
  tts: ({ text, lang }) => client.get("/speech/tts", { params: { text, lang } }, { ttl: 0 }),
  ttsPrompt: (promptId, lang, cfg) => client.post("/speech/pron/tts/", { prompt_id: promptId, lang }, cfg),
  stt: (data, cfg) => client.post("/speech/stt/", data, cfg),
};

// Roleplay Session Flows
const RoleplaySession = {
  start: (payload, cfg) => client.post("/roleplay-session/start/", payload, cfg),
  submit: (payload, cfg) => client.post("/roleplay-session/submit/", payload, cfg),
  practic: (payload, cfg) => client.post("/roleplay-session/practice/", payload, cfg), // Note: 'practic' matching your old file
  startPractice: (payload, cfg) => client.post("/roleplay-session/start-practice/", payload, cfg),
  submitPractice: (payload, cfg) => client.post("/roleplay-session/submit-practice/", payload, cfg),
  history: (params, cfg) => client.get("/roleplay-session/history/", { params, ...cfg }),
  resume: (id, cfg) => client.get(`/roleplay-session/${id}/resume/`, cfg),
};

// Tools
async function exportChatTraining() {
  const url = "/export/chat_training.jsonl";
  const res = await client.instance.get(url, { responseType: "blob" });
  return res.data;
}

// --- EXPORT API ---
export const api = {
  ...client, // Expose instance, get, post, invalidateAllCache...
  baseURL: BASE_URL,
  ...Resources,
  
  // Custom Scopes/Objects
  LearningSessions,
  SkillSessions,
  UsersApp,
  Chat,
  Pron,
  Speech,
  SpeechPron,
  RoleplaySession,
  
  exportChatTraining,
  refreshToken: () => client.post(REFRESH_URL, { refresh: localStorage.getItem("refresh") }), // manual trigger if needed
};

export default api;