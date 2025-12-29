import React from "react";
import { Award, CheckCircle2, Lock, Loader2, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; 
import { api } from "../../api/api";

const DEBUG =
  (import.meta.env && import.meta.env.DEV) ||
  (import.meta.env && import.meta.env.VITE_DEBUG_API === "1") ||
  (typeof window !== "undefined" &&
    localStorage.getItem("debug_api") === "1");

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Hiệu ứng xuất hiện lần lượt
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
// --------------------------

function getBadgeTarget(criteria) {
  if (!criteria || typeof criteria !== "object") return 0;
  if (typeof criteria.target === "number") return criteria.target;
  if (typeof criteria.days === "number") return criteria.days;
  if (typeof criteria.count === "number") return criteria.count;
  if (typeof criteria.xp === "number") return criteria.xp;
  if (typeof criteria.lessons === "number") return criteria.lessons;
  return 0;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function Task() {
  const [badges, setBadges] = React.useState([]);
  const [userBadges, setUserBadges] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [badgeRes, userBadgeRes] = await Promise.all([
          api.Badges.list(),
          api.MyBadges.list(),
        ]);

        if (cancelled) return;

        const allBadges =
          (badgeRes && Array.isArray(badgeRes.results)
            ? badgeRes.results
            : badgeRes) || [];
        const userBadgeList =
          (userBadgeRes && Array.isArray(userBadgeRes.results)
            ? userBadgeRes.results
            : userBadgeRes) || [];

        if (DEBUG) {
          console.log("[Task] badges =", allBadges);
          console.log("[Task] userBadges =", userBadgeList);
        }

        setBadges(allBadges);
        setUserBadges(userBadgeList);
      } catch (err) {
        if (cancelled) return;
        if (DEBUG) {
          console.error("[Task] load error:", err);
        }
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          "Không thể tải nhiệm vụ, vui lòng thử lại.";
        setError(detail);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const userBadgeMap = React.useMemo(() => {
    const m = new Map();
    for (const ub of userBadges || []) {
      m.set(ub.badge, ub);
    }
    return m;
  }, [userBadges]);

  const earnedCount = React.useMemo(() => {
    return badges.filter((badge) => {
      const ub = userBadgeMap.get(badge.id);
      if (!ub) return false;

      const target = getBadgeTarget(badge.criteria);
      const progress = ub.progress ?? 0;

      if (target > 0) {
        return progress >= target;
      }
      return true;
    }).length;
  }, [badges, userBadgeMap]);

  const totalBadges = badges.length;

  return (
    <div className="min-h-[200px] w-full px-4 py-6 sm:px-6 lg:px-8">
      {/* Header with Animation */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nhiệm vụ &amp; Huy hiệu
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Hoàn thành bài học, giữ streak và đạt mốc XP để mở khóa huy hiệu.
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm"
        >
          <Award className="h-6 w-6 text-yellow-500" />
          <div className="text-right">
            <p className="text-xs text-gray-500">Huy hiệu đã đạt</p>
            <p className="text-lg font-semibold text-gray-900">
              {earnedCount}{" "}
              <span className="text-xs text-gray-500">/ {totalBadges}</span>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[200px] items-center justify-center"
          >
            <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-sm text-gray-600">
                Đang tải nhiệm vụ...
              </span>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        ) : totalBadges === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-dashed bg-white px-4 py-6 text-center text-sm text-gray-500"
          >
            Chưa cấu hình huy hiệu nào. Hãy thêm một vài <code>Badge</code> ở
            backend.
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {badges.map((badge) => {
              const ub = userBadgeMap.get(badge.id);
              const target = getBadgeTarget(badge.criteria);
              const progress = ub?.progress ?? 0;

              let percent = 0;
              if (target > 0) {
                percent = Math.min(100, Math.round((progress / target) * 100));
              } else if (ub) {
                percent = 100;
              }

              let status = "locked";
              let statusLabel = "Chưa mở khóa";
              let statusClass =
                "bg-gray-100 text-gray-600 border border-gray-200";

              if (ub && percent >= 100) {
                status = "earned";
                statusLabel = "Đã đạt";
                statusClass =
                  "bg-emerald-50 text-emerald-700 border border-emerald-200";
              } else if (ub && percent < 100) {
                status = "in_progress";
                statusLabel = "Đang hoàn thành";
                statusClass =
                  "bg-blue-50 text-blue-700 border border-blue-200";
              }

              const showProgressBar = target > 0 || ub;
              const hasIcon =
                typeof badge.icon === "string" && badge.icon.trim().length > 0;
              const isIconUrl =
                hasIcon &&
                (badge.icon.startsWith("http://") ||
                  badge.icon.startsWith("https://"));

              return (
                <motion.div
                  key={badge.id}
                  variants={itemVariants}
                  whileHover={{
                    y: -5,
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  }}
                  className="relative flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition-colors"
                >
                  {/* Status chip */}
                  <div className="flex justify-end mb-2">
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass}`}
                    >
                      {status === "earned" && (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {status === "in_progress" && (
                        <Target className="h-3.5 w-3.5" />
                      )}
                      {status === "locked" && <Lock className="h-3.5 w-3.5" />}
                      <span>{statusLabel}</span>
                    </div>
                  </div>

                  {/* ICON – center */}
                  <div className="flex justify-center pt-4 pb-3">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-600"
                    >
                      {hasIcon ? (
                        isIconUrl ? (
                          <img
                            src={badge.icon}
                            alt={badge.name}
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <span className="text-2xl font-bold">
                            {badge.icon[0]?.toUpperCase() ||
                              badge.name[0]?.toUpperCase() ||
                              "🏅"}
                          </span>
                        )
                      ) : (
                        <Award className="h-7 w-7" />
                      )}
                    </motion.div>
                  </div>

                  {/* NAME */}
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {badge.name}
                    </h3>

                    {badge.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {badge.description}
                      </p>
                    )}

                    {ub?.awarded_at && status === "earned" && (
                      <p className="mt-1 text-[11px] text-emerald-600">
                        Đạt ngày {formatDate(ub.awarded_at)}
                      </p>
                    )}
                  </div>

                  {/* PROGRESS – bottom */}
                  {showProgressBar && (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-[11px] text-gray-500">
                        <span>
                          {status === "earned" ? "Hoàn thành" : "Tiến độ"}
                        </span>
                        {target > 0 && (
                          <span>
                            {Math.min(progress, target)} / {target}
                          </span>
                        )}
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}