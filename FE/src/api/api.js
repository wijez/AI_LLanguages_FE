import axios from "axios";

const BASE_URL = (() => {
  const env = import.meta.env.VITE_API_URL?.trim()?.replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/$/, "")}/api`; // dùng cùng origin nếu đã cấu hình proxy /api trên Vercel
  }
  throw new Error("VITE_API_URL is not set and window is undefined (SSR). Set VITE_API_URL in env.");
})();


const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 20000);
const REFRESH_URL = new URL("/users/token/refresh/", BASE_URL).toString();

// Bật log khi: chế độ dev, VITE_DEBUG_API=1, hoặc localStorage.debug_api=1
const DEBUG =
  import.meta.env.DEV ||
  import.meta.env.VITE_DEBUG_API === "1" ||
  (typeof window !== "undefined" && localStorage.getItem("debug_api") === "1");

/* =========================================================
 *  AXIOS INSTANCE
 * =======================================================*/
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  withCredentials: false, 
});


/* =========================================================
 *  REQUEST INTERCEPTOR (JWT + i18n + debug log)
 * =======================================================*/
 instance.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers || {};

  // Chỉ bypass interstitial khi gọi ngrok
  try {
    const abs = new URL(cfg.url || "", cfg.baseURL || window.location.origin);
    const isNgrok = /\.ngrok(?:-free)?\.app$/i.test(abs.host);
    if (isNgrok) {
      cfg.headers["ngrok-skip-browser-warning"] = "true";
    } else {
      delete cfg.headers["ngrok-skip-browser-warning"];
    }
  } catch {
    // ignore URL parse errors
  }

  // JWT
  const access =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;
  if (access) cfg.headers.Authorization = `Bearer ${access}`;
  else delete cfg.headers.Authorization;

  // i18n
  const lng =
    typeof window !== "undefined" ? localStorage.getItem("lang") : null;
  if (lng) cfg.headers["Accept-Language"] = lng;
  else delete cfg.headers["Accept-Language"];

  if (DEBUG) {
    const method = (cfg.method || "get").toUpperCase();
    console.groupCollapsed(
      `%c[API] → ${method} ${cfg.baseURL || ""}${cfg.url || ""}`,
      "color:#3b82f6;font-weight:700"
    );
    console.log("Headers:", cfg.headers);
    console.log("Params :", cfg.params);
    console.log("Data   :", cfg.data);
    console.groupEnd();
  }
  return cfg;
});


/* =========================================================
 *  REFRESH TOKEN HELPER
 * =======================================================*/
let refreshing = null;

async function refreshAccessToken() {
  if (refreshing) return refreshing;

  const refresh =
    typeof window !== "undefined" ? localStorage.getItem("refresh") : null;
  if (!refresh) throw new Error("NO_REFRESH_TOKEN");

  refreshing = axios
    .post(REFRESH_URL, { refresh })
    .then(({ data }) => {
      const token = data?.access || data?.access_token;
      if (!token) throw new Error("NO_ACCESS_IN_REFRESH_RESPONSE");
      if (typeof window !== "undefined") {
        // đảm bảo đồng bộ key
        localStorage.setItem("access", token);
      }
      return token;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

/* =========================================================
 *  RESPONSE INTERCEPTOR (debug log + auto refresh 401)
 * =======================================================*/
instance.interceptors.response.use(
  (res) => {
    if (DEBUG) {
      console.groupCollapsed(
        `%c[API] ← ${res.status} ${res.config?.url}`,
        "color:#10b981;font-weight:700"
      );
      console.log("Data:", res.data);
      console.groupEnd();
    }
    return res;
  },
  async (err) => {
    const { config, response } = err || {};
    const status = response?.status;
    const reqUrl = response?.config?.url || config?.url || "";

    if (DEBUG) {
      console.group("%c[API ERROR]", "color:#ef4444;font-weight:700");
      console.error(err);
      if (response) {
        console.log("Status :", status);
        console.log("URL    :", reqUrl);
        console.log("Params :", response.config?.params);
        console.log("Data   :", response.data);
      }
      console.groupEnd();
    }

    // Tránh lặp khi chính call refresh bị 401
    const isRefreshCall = (reqUrl || "").includes("/users/token/refresh/");

    // Auto refresh 1 lần khi 401 (trừ refresh endpoint)
    if (status === 401 && !config?.__isRetry && !isRefreshCall) {
      try {
        const newAccess = await refreshAccessToken();
        const retryCfg = { ...config, __isRetry: true };
        retryCfg.headers = {
          ...(retryCfg.headers || {}),
          Authorization: `Bearer ${newAccess}`,
        };
        return instance(retryCfg);
      } catch {
        // Refresh fail → xoá token & chuyển login
        if (typeof window !== "undefined") {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          const next = encodeURIComponent(
            window.location.pathname + window.location.search
          );
          window.location.href = `/login?next=${next}`;
        }
      }
    }

    throw err;
  }
);

/* =========================================================
 *  TIỆN ÍCH CƠ BẢN
 * =======================================================*/
const ensureSlash = (s) => (s.endsWith("/") ? s : `${s}/`);
const joinPath = (a, b = "") =>
  ensureSlash(a) + (b.startsWith("/") ? b.slice(1) : b);
const unwrap = (res) => res?.data;

/* =========================================================
 *  CACHE GET + DE-DUPE
 * =======================================================*/
const inflight = new Map(); // key -> Promise
const cache = new Map(); // key -> { expiry, data }

const keyOf = (method, url, params) =>
  `${method}:${url}?${
    params ? JSON.stringify(params, Object.keys(params).sort()) : ""
  }`;

async function getCached(url, config = {}, { ttl = 5000, dedupe = true } = {}) {
  const key = keyOf("GET", url, config?.params);
  const now = Date.now();

  const hit = cache.get(key);
  if (hit && hit.expiry > now) return hit.data;

  if (dedupe && inflight.has(key)) return inflight.get(key);

  const req = instance
    .get(url, config)
    .then((res) => {
      cache.set(key, { expiry: now + ttl, data: res });
      inflight.delete(key);
      return res;
    })
    .catch((e) => {
      inflight.delete(key);
      throw e;
    });

  inflight.set(key, req);
  return req;
}

function invalidateAll() {
  cache.clear();
}

/* =========================================================
 *  CRUD FACTORY (DRF-style)
 * =======================================================*/
function crud(resourceBase) {
  const base = ensureSlash(resourceBase);
  return {
    list: (params, opts) => getCached(base, { params }, opts).then(unwrap),
    get: (id, opts) =>
      getCached(joinPath(base, `${id}/`), {}, opts).then(unwrap),
    create: (payload, cfg) =>
      instance.post(base, payload, cfg).then(unwrap).finally(invalidateAll),
    update: (id, payload, cfg) =>
      instance
        .put(joinPath(base, `${id}/`), payload, cfg)
        .then(unwrap)
        .finally(invalidateAll),
    patch: (id, payload, cfg) =>
      instance
        .patch(joinPath(base, `${id}/`), payload, cfg)
        .then(unwrap)
        .finally(invalidateAll),
    remove: (id, cfg) =>
      instance
        .delete(joinPath(base, `${id}/`), cfg)
        .then(unwrap)
        .finally(invalidateAll),
  };
}

/* =========================================================
 *  SCOPE TỰ DO (endpoint không theo CRUD)
 * =======================================================*/
function scope(prefix) {
  const base = ensureSlash(prefix);
  return {
    get: (p = "", cfg, opts) =>
      getCached(joinPath(base, p), cfg, opts).then(unwrap),
    post: (p = "", data, cfg) =>
      instance.post(joinPath(base, p), data, cfg).then(unwrap),
    put: (p = "", data, cfg) =>
      instance.put(joinPath(base, p), data, cfg).then(unwrap),
    patch: (p = "", data, cfg) =>
      instance.patch(joinPath(base, p), data, cfg).then(unwrap),
    delete: (p = "", cfg) =>
      instance.delete(joinPath(base, p), cfg).then(unwrap),
  };
}

/* =========================================================
 *  RESOURCES THEO Django DefaultRouter
 * =======================================================*/
const Resources = {
  // Users
  Users: crud("/users/"),
  AccountSettings: crud("/settings/"),
  SwitchAccount: crud("/switchaccount/"),

  // Language
  Languages: crud("/languages/"),
  Enrollments: crud("/enrollments/"),
  Lessons: crud("/lessons/"),
  Topics: crud("/topics/"),
  TopicSkills: crud("/topic-skill/"),
  TopicProgress: crud("/progress/"),
  Skills: crud("/skills/"),
  UserSkillStats: crud("/user-skill-stats/"),
  SkillStats: crud("/skill-stats/"),
  RoleplayScenarios: crud("/roleplay-scenario/"),
  RoleplayBlocks: crud("/roleplay-block/"),
  // Vocabulary
  AudioAssets: crud("/audio-assets/"),
  KnownWords: crud("/known-words/"),
  Translations: crud("/translations/"),
  Words: crud("/words/"),
  WordRelations: crud("/word-relations/"),
  Mistake: crud("/mistake/"),
  LearningInteraction: crud("/learning-interaction/"),

  // Progress
  DailyXP: crud("/daily-xp/"),

  // Social
  Friends: crud("/friends/"),
  CalendarEvents: crud("/calendar-events/"),
  LeaderboardEntries: crud("/leaderboard-entries/"),
};

/* =========================================================
 *  APP SCOPES RIÊNG (include trong urls.py)
 * =======================================================*/
// path("api/users/", include("users.urls"))
const UsersApp = scope("/users/");

// path("api/chat/", include("chat.urls"))
const Chat = scope("/chat/");

// path("api/pron/", include("pron.urls"))
const Pron = scope("/pron/");

// path("api/", include("speech.urls")) → gắn thẳng /api/
const Speech = scope("/");

/* =========================================================
 *  TOOLS / UTILITIES
 * =======================================================*/
async function exportChatTraining() {
  const url = "/export/chat_training.jsonl";
  const res = await instance.get(url, { responseType: "blob" });
  return res.data; // Blob
}

/* =========================================================
 *  EXTEND: Lessons
 * =======================================================*/
Resources.Lessons = {
  ...Resources.Lessons,

  // GET /api/lessons/:id/skills/
  skills: (lessonId, params = {}, opts) =>
    getCached(`/lessons/${lessonId}/skills/`, { params }, opts).then(unwrap),

  // POST /api/lessons/:id/add-skill/
  addSkill: (lessonId, payload, cfg) =>
    instance
      .post(`/lessons/${lessonId}/add-skill/`, payload, cfg)
      .then(unwrap)
      .finally(invalidateAll),
};

/* =========================================================
 *  EXTEND: Skills
 * =======================================================*/
Resources.Skills = {
  ...Resources.Skills,

  // GET /api/skills/:id/questions/
  questions: (skillId, params = {}, opts) =>
    getCached(`/skills/${skillId}/questions/`, { params }, opts).then(unwrap),

  // POST /api/skills/:id/upsert-questions/
  upsertQuestions: (skillId, payload, cfg) =>
    instance
      .post(`/skills/${skillId}/upsert-questions/`, payload, cfg)
      .then(unwrap)
      .finally(invalidateAll),

  // GET skill theo lesson (ưu tiên subroute; fallback query param)
  byLesson: async ({ lesson, ...params } = {}, opts) => {
    try {
      return await getCached(
        `/lessons/${lesson}/skills/`,
        { params },
        opts
      ).then(unwrap);
    } catch {
      return getCached(
        "/skills/",
        { params: { lesson, ...params } },
        opts
      ).then(unwrap);
    }
  },
};

/* =========================================================
 *  EXTEND: Topics
 * =======================================================*/
Resources.Topics = {
  ...Resources.Topics,

  // GET /api/topics/by-language/?language_abbr=...&language_id=...&page_size=...
  byLanguage: (params = {}, opts) =>
    getCached("/topics/by-language/", { params }, opts).then(unwrap),

  // GET /api/topics/:topicId/lessons/
  lessons: (topicId, params = {}, opts) =>
    getCached(`/topics/${topicId}/lessons/`, { params }, opts).then(unwrap),

  // GET /api/topics/:topicId/skills/
  skills: (topicId, params = {}, opts) =>
    getCached(`/topics/${topicId}/skills/`, { params }, opts).then(unwrap),
};

/* =========================================================
 *  EXTEND: LearningSessions
 * =======================================================*/
Resources.LearningSessions = {
  ...crud("/learning/sessions/"),

  list: (params, opts) =>
    getCached("/learning/sessions/", { params }, opts).then(unwrap),

  // GET /api/learning/sessions/:id/
  get: (id, opts) =>
    getCached(`/learning/sessions/${id}/`, {}, opts).then(unwrap),

  // POST /api/learning/sessions/start/
  start: (payload, cfg) =>
    instance.post("/learning/sessions/start/", payload, cfg).then(unwrap),

  // POST /api/learning/sessions/:id/answer/
  answer: (id, payload, cfg) =>
    instance
      .post(`/learning/sessions/${id}/answer/`, payload, cfg)
      .then(unwrap),

  // POST /api/learning/sessions/:id/complete/
  complete: (id, payload, cfg) =>
    instance
      .post(`/learning/sessions/${id}/complete/`, payload, cfg)
      .then(unwrap),

  // POST /api/learning/sessions/:id/cancel/
  cancel: (id, payload, cfg) =>
    instance
      .post(`/learning/sessions/${id}/cancel/`, payload, cfg)
      .then(unwrap),
};

/* =========================================================
 *  EXTEND: Enrollments
 * =======================================================*/
Resources.Enrollments = {
  ...Resources.Enrollments,

  me: (params = {}, opts) =>
    getCached("/enrollments/me/", { params }, opts).then(unwrap),

  // POST /api/enrollments/ { abbreviation:'zh', ... } → tạo enrollment bằng abbr
  createByAbbr: (abbr, payload = {}, cfg) =>
    instance
      .post("/enrollments/", { abbreviation: abbr, ...payload }, cfg)
      .then(unwrap)
      .finally(invalidateAll),
};
/* =========================================================
 *  EXTEND: Users
 * =======================================================*/
Resources.Users = {
  ...Resources.Users,

  // GET /api/users/me/
  me: (params = {}, opts) =>
    getCached("/users/me/", { params }, opts).then(unwrap),

  // PATCH /api/users/me/
  updateMe: (payload, cfg) =>
    instance
      .patch("/users/me/", payload, cfg)
      .then(unwrap)
      .finally(invalidateAll),
};
/* =========================================================
 *  EXTEND: Mistakes
 * =======================================================*/
Resources.Mistakes = {
  ...crud("/mistake/"),
  bySkill: (skillId, params, opts) =>
    getCached(
      "/mistake/",
      { params: { skill: skillId, ordering: "-timestamp", ...params } },
      opts
    ).then(unwrap),
};

/* =========================================================
 *  EXPORT API
 * =======================================================*/
export const api = {
  instance,
  baseURL: BASE_URL,

  // gọi tự do
  get: (url, cfg, opts) => getCached(url, cfg, opts).then(unwrap),
  post: (url, data, cfg) => instance.post(url, data, cfg).then(unwrap),
  put: (url, data, cfg) => instance.put(url, data, cfg).then(unwrap),
  patch: (url, data, cfg) => instance.patch(url, data, cfg).then(unwrap),
  delete: (url, cfg) => instance.delete(url, cfg).then(unwrap),

  // nhóm CRUD theo router
  ...Resources,

  // scopes app con
  UsersApp,
  Chat,
  Pron,
  Speech,

  // tools
  exportChatTraining,

  // tiện ích
  invalidateAll,
  refreshToken: refreshAccessToken,
};

export default api;
