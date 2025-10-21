import axios from 'axios';

/** ================== CONFIG CƠ BẢN ================== */
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://127.0.0.1:8000/api');

const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 20000);
const REFRESH_URL =
  (import.meta.env && import.meta.env.VITE_REFRESH_URL)
    || 'http://127.0.0.1:8000/api/users/token/refresh/';

// Bật log khi chạy dev, hoặc VITE_DEBUG_API=1, hoặc localStorage.debug_api=1
const DEBUG =
  import.meta.env.DEV ||
  import.meta.env.VITE_DEBUG_API === '1' ||
  (typeof window !== 'undefined' && localStorage.getItem('debug_api') === '1');

/** ================== AXIOS INSTANCE ================== */
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
});

/** ====== Request Interceptor (Token + i18n + log) ====== */
instance.interceptors.request.use((cfg) => {
  // JWT
  const access = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
  if (access) cfg.headers.Authorization = `Bearer ${access}`;

  // I18n
  const lng = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
  if (lng) cfg.headers['Accept-Language'] = lng;

  if (DEBUG) {
    const method = (cfg.method || 'get').toUpperCase();
    // eslint-disable-next-line no-console
    console.groupCollapsed(
      `%c[API] → ${method} ${cfg.baseURL}${cfg.url}`,
      'color:#3b82f6;font-weight:700'
    );
    // eslint-disable-next-line no-console
    console.log('Headers:', cfg.headers);
    // eslint-disable-next-line no-console
    console.log('Params :', cfg.params);
    // eslint-disable-next-line no-console
    console.log('Data   :', cfg.data);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  return cfg;
});

/** ====== Refresh Token Helper ====== */
let refreshing = null;
async function refreshAccessToken() {
  if (refreshing) return refreshing;

  const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh') : null;
  if (!refresh) throw new Error('NO_REFRESH_TOKEN');

  refreshing = axios
    .post(REFRESH_URL, { refresh })
    .then(({ data }) => {
      const token = data?.access || data?.access_token;
      if (!token) throw new Error('NO_ACCESS_IN_REFRESH_RESPONSE');
      if (typeof window !== 'undefined') {
        localStorage.setItem('access', token); // ✅ đảm bảo đồng bộ key
      }
      return token;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

/** ====== Response Interceptor (log + auto refresh 401) ====== */
instance.interceptors.response.use(
  (res) => {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.groupCollapsed(
        `%c[API] ← ${res.status} ${res.config?.url}`,
        'color:#10b981;font-weight:700'
      );
      // eslint-disable-next-line no-console
      console.log('Data:', res.data);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
    return res;
  },
  async (err) => {
    const { config, response } = err || {};
    const status = response?.status;
    const reqUrl = response?.config?.url || config?.url || '';

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.group('%c[API ERROR]', 'color:#ef4444;font-weight:700');
      // eslint-disable-next-line no-console
      console.error(err);
      if (response) {
        // eslint-disable-next-line no-console
        console.log('Status :', status);
        // eslint-disable-next-line no-console
        console.log('URL    :', reqUrl);
        // eslint-disable-next-line no-console
        console.log('Params :', response.config?.params);
        // eslint-disable-next-line no-console
        console.log('Data   :', response.data);
      }
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    // Tránh lặp khi chính call refresh bị 401
    const isRefreshCall = (reqUrl || '').includes('/users/token/refresh/');

    // Auto refresh 1 lần khi 401 (trừ refresh endpoint)
    if (status === 401 && !config?.__isRetry && !isRefreshCall) {
      try {
        const newAccess = await refreshAccessToken();
        const retryCfg = { ...config, __isRetry: true };
        retryCfg.headers = { ...(retryCfg.headers || {}), Authorization: `Bearer ${newAccess}` };
        return instance(retryCfg);
      } catch {
        // Refresh fail → xoá token & chuyển login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?next=${next}`;
        }
      }
    }

    throw err;
  }
);

/** ================== HELPERS ================== */
const ensureSlash = (s) => (s.endsWith('/') ? s : `${s}/`);
const joinPath = (a, b = '') => ensureSlash(a) + (b.startsWith('/') ? b.slice(1) : b);
const unwrap = (res) => res?.data;

/** ====== Cache GET + de-dupe ====== */
const inflight = new Map(); // key -> Promise
const cache = new Map();    // key -> { expiry, data }

const keyOf = (method, url, params) =>
  `${method}:${url}?${params ? JSON.stringify(params, Object.keys(params).sort()) : ''}`;

async function getCached(url, config = {}, { ttl = 5000, dedupe = true } = {}) {
  const key = keyOf('GET', url, config?.params);
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

/** ====== CRUD Factory cho DRF ====== */
function crud(resourceBase) {
  const base = ensureSlash(resourceBase);
  return {
    list:   (params, opts)        => getCached(base, { params }, opts).then(unwrap),
    get:    (id, opts)            => getCached(joinPath(base, `${id}/`), {}, opts).then(unwrap),
    create: (payload, cfg)        => instance.post(base, payload, cfg).then(unwrap).finally(invalidateAll),
    update: (id, payload, cfg)    => instance.put(joinPath(base, `${id}/`), payload, cfg).then(unwrap).finally(invalidateAll),
    patch:  (id, payload, cfg)    => instance.patch(joinPath(base, `${id}/`), payload, cfg).then(unwrap).finally(invalidateAll),
    remove: (id, cfg)             => instance.delete(joinPath(base, `${id}/`), cfg).then(unwrap).finally(invalidateAll),
  };
}

/** ====== Scope tuỳ ý (cho endpoint không theo CRUD) ====== */
function scope(prefix) {
  const base = ensureSlash(prefix);
  return {
    get:    (p = '', cfg, opts) => getCached(joinPath(base, p), cfg, opts).then(unwrap),
    post:   (p = '', data, cfg)  => instance.post(joinPath(base, p), data, cfg).then(unwrap),
    put:    (p = '', data, cfg)  => instance.put(joinPath(base, p), data, cfg).then(unwrap),
    patch:  (p = '', data, cfg)  => instance.patch(joinPath(base, p), data, cfg).then(unwrap),
    delete: (p = '', cfg)        => instance.delete(joinPath(base, p), cfg).then(unwrap),
  };
}

/** ====== Resources theo Django DefaultRouter====== */

// User
const Resources = {
  Users:              crud('/users/'),
  AccountSettings:    crud('/settings/'),
  SwitchAccount:      crud('/switchaccount/'),

  // Language
  Languages:          crud('/languages/'),
  Enrollments:        crud('/enrollments/'),
  Lessons:            crud('/lessons/'),
  Topics:             crud('/topics/'),
  TopicSkills:        crud('/topic-skill/'),
  TopicProgress:      crud('/progress/'),
  Skills:             crud('/skills/'),
  UserSkillStats:     crud('/user-skill-stats/'),
  SkillStats:         crud('/skill-stats/'),

  // Vocabulary
  AudioAssets:        crud('/audio-assets/'),
  KnownWords:         crud('/known-words/'),
  Translations:       crud('/translations/'),
  Words:              crud('/words/'),
  WordRelations:      crud('/word-relations/'),
  Mistake:            crud('/mistake/'),
  LearningInteraction: crud('/learning-interaction/'),

  // Progress
  DailyXP:            crud('/daily-xp/'),

  // Social
  Friends:            crud('/friends/'),
  CalendarEvents:     crud('/calendar-events/'),
  LeaderboardEntries: crud('/leaderboard-entries/'),
};

/** ====== Các app include riêng trong urls.py ====== */
// path("api/users/", include("users.urls")),
const UsersApp  = scope('/users/');
// path("api/chat/", include("chat.urls"))
const Chat      = scope('/chat/');
// path("api/pron/", include("pron.urls"))
const Pron      = scope('/pron/');
// path("api/", include("speech.urls"))  -> gắn thẳng /api/
const Speech    = scope('/');

// /api/export/chat_training.jsonl
async function exportChatTraining() {
  const url = '/export/chat_training.jsonl';
  const res = await instance.get(url, { responseType: 'blob' });
  return res.data; // Blob
}

// Bổ sung sub-route tuỳ biến
Resources.Skills = {
  ...Resources.Skills,
  lessons: (skillId, params, opts) =>
    getCached(`/skills/${skillId}/lessons/`, { params }, opts).then(unwrap),
};

Resources.Topics = {
  ...Resources.Topics,

  // GET /api/topics/by-language/?language_abbr=zh&language_id=3&page_size=200 ...
  byLanguage: (params = {}, opts) =>
    getCached('/topics/by-language/', { params }, opts).then(unwrap),
};

Resources.Enrollments = {
  ...Resources.Enrollments,

  me: (params = {}, opts) =>
    getCached('/enrollments/me/', { params }, opts).then(unwrap),

  // POST /api/enrollments/ {abbreviation:'zh', ...}  → tạo enrollment bằng abbr
  createByAbbr: (abbr, payload = {}, cfg) =>
    instance
      .post('/enrollments/', { abbreviation: abbr, ...payload }, cfg)
      .then(unwrap)
      .finally(invalidateAll),
};
/** ====== Export API ====== */
export const api = {
  instance,
  baseURL: BASE_URL,

  // gọi tự do
  get:    (url, cfg, opts) => getCached(url, cfg, opts).then(unwrap),
  post:   (url, data, cfg) => instance.post(url, data, cfg).then(unwrap),
  put:    (url, data, cfg) => instance.put(url, data, cfg).then(unwrap),
  patch:  (url, data, cfg) => instance.patch(url, data, cfg).then(unwrap),
  delete: (url, cfg)       => instance.delete(url, cfg).then(unwrap),

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
