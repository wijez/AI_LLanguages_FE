import axios from "axios";

// --- 1. CONFIG & UTILS ---
export const DEBUG =
  import.meta.env.DEV ||
  import.meta.env.VITE_DEBUG_API === "1" ||
  (typeof window !== "undefined" && localStorage.getItem("debug_api") === "1");

const unwrap = (res) => res?.data;
const ensureSlash = (s) => (s.endsWith("/") ? s : `${s}/`);
const joinPath = (a, b = "") =>
  ensureSlash(a) + (b.startsWith("/") ? b.slice(1) : b);

// --- 2. LOGGING ---
const logRequest = (cfg, prefix) => {
  if (!DEBUG) return;
  const method = (cfg.method || "get").toUpperCase();
  console.groupCollapsed(
    `%c[${prefix}] → ${method} ${cfg.baseURL || ""}${cfg.url || ""}`,
    "color:#3b82f6;font-weight:700"
  );
  console.log("Headers:", cfg.headers);
  console.log("Params :", cfg.params);
  console.log("Data   :", cfg.data);
  console.groupEnd();
};

const logResponse = (res, prefix) => {
  if (!DEBUG) return;
  console.groupCollapsed(
    `%c[${prefix}] ← ${res.status} ${res.config?.url}`,
    "color:#10b981;font-weight:700"
  );
  console.log("Data:", res.data);
  console.groupEnd();
};

const logError = (err, prefix) => {
  if (!DEBUG) return;
  const { config, response } = err || {};
  console.group("%c[API ERROR]", "color:#ef4444;font-weight:700");
  console.error(err);
  if (response) {
    console.log(`Source : ${prefix}`);
    console.log("Status :", response.status);
    console.log("URL    :", config?.url);
    console.log("Data   :", response.data);
  }
  console.groupEnd();
};

// --- 3. CACHING LOGIC (Singleton across instances or per instance) ---
const inflight = new Map();
const cache = new Map();

export const invalidateAllCache = () => {
    cache.clear();
    if (DEBUG) console.log("%c[CACHE] Cleared all", "color: orange");
};

const getKey = (method, url, params) =>
  `${method}:${url}?${params ? JSON.stringify(params, Object.keys(params).sort()) : ""}`;

// --- 4. REFRESH TOKEN LOGIC (Singleton Pattern) ---
// Biến này dùng chung cho cả hệ thống để tránh gọi refresh 2 lần cùng lúc
let refreshingPromise = null;

const handleRefreshToken = async (refreshUrl) => {
  if (refreshingPromise) return refreshingPromise;

  const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh") : null;
  if (!refresh) return Promise.reject("NO_REFRESH_TOKEN");

  refreshingPromise = axios
    .post(
      refreshUrl,
      { refresh },
      { headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" } }
    )
    .then(({ data }) => {
      const token = data?.access || data?.access_token;
      if (!token) throw new Error("REFRESH_FAILED");
      
      if (typeof window !== "undefined") {
        localStorage.setItem("access", token);
        if (data?.refresh) localStorage.setItem("refresh", data.refresh);
      }
      return token;
    })
    .finally(() => {
      refreshingPromise = null;
    });

  return refreshingPromise;
};

// --- 5. FACTORY FUNCTION ---
export function createApiClient({ baseURL, timeout = 20000, refreshUrl, debugPrefix = "API" }) {
  const instance = axios.create({
    baseURL,
    timeout: Number(timeout),
    withCredentials: false,
  });

  // Update Authorization header helper
  const setAuthHeader = (token) => {
      instance.defaults.headers.common.Authorization = `Bearer ${token}`;
  };

  // --- Request Interceptor ---
  instance.interceptors.request.use((cfg) => {
    cfg.headers = cfg.headers || {};

    // Ngrok
    try {
      const abs = new URL(cfg.url || "", cfg.baseURL || window.location.origin);
      if (/\.ngrok(?:-free)?\.app$/i.test(abs.host)) {
        cfg.headers["ngrok-skip-browser-warning"] = "true";
      }
    } catch {}

    // Auth & Lang
    if (typeof window !== "undefined") {
      const access = localStorage.getItem("access");
      const lang = localStorage.getItem("lang");
      if (access) cfg.headers.Authorization = `Bearer ${access}`;
      if (lang) cfg.headers["Accept-Language"] = lang;
    }

    logRequest(cfg, debugPrefix);
    return cfg;
  });

  // --- Response Interceptor ---
  instance.interceptors.response.use(
    (res) => {
      logResponse(res, debugPrefix);
      return res;
    },
    async (err) => {
      const { config, response } = err || {};
      logError(err, debugPrefix);

      const isRefreshCall = config?.url === refreshUrl || (config?.url || "").includes("token/refresh");
      
      // Auto Refresh Logic
      if (response?.status === 401 && !config?.__isRetry && !isRefreshCall && refreshUrl) {
        try {
          const newToken = await handleRefreshToken(refreshUrl);
          
          // Retry request cũ
          config.__isRetry = true;
          config.headers.Authorization = `Bearer ${newToken}`;
          setAuthHeader(newToken); // Update default for future requests
          
          return instance(config);
        } catch (e) {
            // Nếu refresh thất bại -> Logout
            if (typeof window !== "undefined") {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                // Optional: window.location.href = "/login";
            }
            return Promise.reject(e);
        }
      }
      return Promise.reject(err);
    }
  );

  // --- Public Methods ---
  
  // Custom Get with Cache
  const getCached = async (url, config = {}, { ttl = 5000, dedupe = true } = {}) => {
    const key = getKey("GET", url, config.params);
    const now = Date.now();

    const hit = cache.get(key);
    if (hit && hit.expiry > now) return hit.data;
    if (dedupe && inflight.has(key)) return inflight.get(key);

    const req = instance.get(url, config).then((res) => {
      if (ttl > 0) cache.set(key, { expiry: now + ttl, data: res });
      inflight.delete(key);
      return res;
    }).catch(e => {
        inflight.delete(key);
        throw e;
    });

    inflight.set(key, req);
    return req;
  };

  // CRUD Factory
  const createCrud = (path) => {
    const base = ensureSlash(path);
    return {
      list: (params, opts) => getCached(base, { params }, opts).then(unwrap),
      get: (id, opts) => getCached(joinPath(base, `${id}/`), {}, opts).then(unwrap),
      create: (payload, cfg) => instance.post(base, payload, cfg).then(unwrap).finally(invalidateAllCache),
      update: (id, payload, cfg) => instance.put(joinPath(base, `${id}/`), payload, cfg).then(unwrap).finally(invalidateAllCache),
      patch: (id, payload, cfg) => instance.patch(joinPath(base, `${id}/`), payload, cfg).then(unwrap).finally(invalidateAllCache),
      remove: (id, cfg) => instance.delete(joinPath(base, `${id}/`), cfg).then(unwrap).finally(invalidateAllCache),
    };
  };

  // Scope Factory (Custom Endpoints)
  const createScope = (prefix) => {
    const base = ensureSlash(prefix);
    return {
        get: (p = "", cfg, opts) => getCached(joinPath(base, p), cfg, opts).then(unwrap),
        post: (p = "", data, cfg) => instance.post(joinPath(base, p), data, cfg).then(unwrap),
        put: (p = "", data, cfg) => instance.put(joinPath(base, p), data, cfg).then(unwrap),
        patch: (p = "", data, cfg) => instance.patch(joinPath(base, p), data, cfg).then(unwrap),
        delete: (p = "", cfg) => instance.delete(joinPath(base, p), cfg).then(unwrap),
    }
  };

  return {
    instance,
    get: (url, cfg, opts) => getCached(url, cfg, opts).then(unwrap),
    post: (url, data, cfg) => instance.post(url, data, cfg).then(unwrap),
    put: (url, data, cfg) => instance.put(url, data, cfg).then(unwrap),
    patch: (url, data, cfg) => instance.patch(url, data, cfg).then(unwrap),
    delete: (url, cfg) => instance.delete(url, cfg).then(unwrap),
    createCrud,
    createScope,
    invalidateAllCache,
    unwrap
  };
}