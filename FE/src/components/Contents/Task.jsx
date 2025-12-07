import React from "react";
import { Award, CheckCircle2, Lock, Loader2, Target } from "lucide-react";
import { api } from "../../api/api";

const DEBUG =
  (import.meta.env && import.meta.env.DEV) ||
  (import.meta.env && import.meta.env.VITE_DEBUG_API === "1") ||
  (typeof window !== "undefined" &&
    localStorage.getItem("debug_api") === "1");

// Helper: đoán target từ criteria
function getBadgeTarget(criteria) {
  if (!criteria || typeof criteria !== "object") return 0;
  // các key hay dùng: target, days, count, xp, lessons...
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
        // Dùng CRUD đã khai báo trong api.js
        const [badgeRes, userBadgeRes] = await Promise.all([
          api.Badges.list(),
          api.MyBadges.list(),
        ]);

        if (cancelled) return;

        // Hỗ trợ cả dạng mảng thuần và dạng {results: []}
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

  // Map UserBadge theo badge id
  const userBadgeMap = React.useMemo(() => {
    const m = new Map();
    for (const ub of userBadges || []) {
      // DRF ModelSerializer mặc định trả badge = id
      m.set(ub.badge, ub);
    }
    return m;
  }, [userBadges]);

  const earnedCount = userBadges.length;
  const totalBadges = badges.length;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-gray-600">Đang tải nhiệm vụ...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[200px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[200px] w-full px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nhiệm vụ &amp; Huy hiệu
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Hoàn thành bài học, giữ streak và đạt mốc XP để mở khóa huy hiệu.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
          <Award className="h-6 w-6" />
          <div className="text-right">
            <p className="text-xs text-gray-500">Huy hiệu đã đạt</p>
            <p className="text-lg font-semibold text-gray-900">
              {earnedCount}{" "}
              <span className="text-xs text-gray-500">/ {totalBadges}</span>
            </p>
          </div>
        </div>
      </div>

      {totalBadges === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white px-4 py-6 text-center text-sm text-gray-500">
          Chưa cấu hình huy hiệu nào. Hãy thêm một vài <code>Badge</code> ở
          backend.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {badges.map((badge) => {
            const ub = userBadgeMap.get(badge.id);
            const target = getBadgeTarget(badge.criteria);
            const progress = ub?.progress ?? 0;

            let percent = 0;
            if (target > 0) {
              percent = Math.min(100, Math.round((progress / target) * 100));
            } else if (ub) {
              // không có target cụ thể nhưng đã có UserBadge => xem như 100%
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
              <div
                key={badge.id}
                className="relative flex flex-col rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm"
              >
                {/* Status chip */}
                <div
                  className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass}`}
                >
                  {status === "earned" && (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {status === "in_progress" && (
                    <Target className="h-3.5 w-3.5" />
                  )}
                  {status === "locked" && (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span>{statusLabel}</span>
                </div>

                {/* Icon + title */}
                <div className="mb-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-600">
                    {hasIcon ? (
                      isIconUrl ? (
                        // nếu backend trả URL icon
                        <img
                          src={badge.icon}
                          alt={badge.name}
                          className="h-8 w-8 rounded-xl object-contain"
                        />
                      ) : (
                        // nếu backend trả key icon, tạm dùng chữ cái đầu
                        <span className="text-lg font-bold">
                          {badge.icon[0]?.toUpperCase() ||
                            badge.name[0]?.toUpperCase() ||
                            "🏅"}
                        </span>
                      )
                    ) : (
                      <Award className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {badge.name}
                    </h3>
                    {badge.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {badge.description}
                      </p>
                    )}
                    {ub?.awarded_at && status === "earned" && (
                      <p className="mt-1 text-[11px] text-emerald-600">
                        Đạt ngày {formatDate(ub.awarded_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Criteria info */}
                {badge.criteria && Object.keys(badge.criteria || {}).length > 0 && (
                  <div className="mb-2 rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
                    <span className="font-medium text-gray-700">
                      Điều kiện:&nbsp;
                    </span>
                    <span className="break-words">
                      {badge.criteria.type
                        ? `${badge.criteria.type} `
                        : ""}
                      {badge.criteria.days
                        ? `• ${badge.criteria.days} ngày `
                        : ""}
                      {badge.criteria.target
                        ? `• ${badge.criteria.target} `
                        : ""}
                      {!badge.criteria.type &&
                        !badge.criteria.days &&
                        !badge.criteria.target &&
                        JSON.stringify(badge.criteria)}
                    </span>
                  </div>
                )}

                {/* Progress */}
                {showProgressBar && (
                  <div className="mt-auto">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>
                        {status === "earned" ? "Hoàn thành" : "Tiến độ"}
                      </span>
                      {target > 0 && (
                        <span>
                          {Math.min(progress, target)} / {target}
                        </span>
                      )}
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-[width] duration-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
