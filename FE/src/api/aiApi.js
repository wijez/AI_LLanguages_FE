import { createApiClient } from "./api-core";

// --- CONFIG ---
const AI_BASE_URL = (() => {
  const env = import.meta.env.VITE_API_AI_URL?.trim()?.replace(/\/$/, "");
  if (env) return env;
  // Fallback to origin if proxy is set up
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/$/, "")}/api`; 
  }
  throw new Error("VITE_API_AI_URL is not set");
})();

// IMPORTANT: Refresh Token url must point to Main Backend, not AI Backend
const MAIN_BE_URL = import.meta.env.VITE_API_URL?.trim()?.replace(/\/$/, "") || 
                    (typeof window !== "undefined" ? `${window.location.origin}/api` : "");
                    
const REFRESH_URL = `${MAIN_BE_URL}/users/token/refresh/`;

// --- INIT CLIENT ---
const aiClient = createApiClient({
  baseURL: AI_BASE_URL,
  timeout: 600000,
  refreshUrl: REFRESH_URL, // Auto refresh will call this URL on 401
  debugPrefix: "AI-API",
});

const { createCrud, unwrap } = aiClient;

// --- RESOURCES ---
const AI_Resources = {
  Recommendations: {
    ...createCrud("/recommendations/"),
    generate: (payload, cfg) => aiClient.post("/generate-recs/", payload, cfg),
  },

  Feedbacks: createCrud("/feedbacks/"),
  AIModels: createCrud("/ai-models/"),
  TrainingRuns: createCrud("/training-runs/"),
  FeatureSnapshots: createCrud("/feature-snapshots/"),

  // Standalone AI Functions
  predict: (payload, cfg) => aiClient.post("/predict", payload, cfg),
  train: (payload, cfg) => aiClient.post("/train", payload, cfg),
  ingestSnapshot: (payload, cfg) => aiClient.post("/ingest/snapshot", payload, cfg),
};

// --- EXPORT ---
export const aiApi = {
  ...aiClient,
  baseURL: MAIN_BE_URL,
  ...AI_Resources,
};

export default aiApi;