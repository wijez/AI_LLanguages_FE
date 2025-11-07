import React from "react";
import { BookOpen, Repeat, AlertCircle, Lock } from "lucide-react";
import { api } from "../../api/api";
import { useSelector } from "react-redux";
import { selectAbbr, selectOffline } from "../../store/learnSelectors";

const DEBUG =
  (import.meta.env && import.meta.env.DEV) ||
  (typeof window !== "undefined" && localStorage.getItem("debug_api") === "1");

const kLessons = (abbr, topicId) =>
  `lessons.${abbr || "unknown"}.${topicId || "none"}.v2`; // bump key vì có progress
const getCachedLessons = (abbr, topicId) => {
  try {
    const raw = localStorage.getItem(kLessons(abbr, topicId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const setCachedLessons = (abbr, topicId, items) => {
  try {
    localStorage.setItem(kLessons(abbr, topicId), JSON.stringify(items || []));
  } catch (e) {
    if (DEBUG)
      console.warn(`[LessonCard] setCachedLessons failed:`, e?.message);
  }
};

export default function LessonCard({ topic, className = "", onOpenLesson }) {
  const abbr = useSelector(selectAbbr);
  const offline = useSelector(selectOffline);

  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [lessons, setLessons] = React.useState([]);

  const topicId = topic?.id ?? null;
  const topicSlug = topic?.slug ?? null;
  const langCode = (
    topic?.language?.abbreviation ||
    topic?.language?.code ||
    abbr ||
    ""
  ).toLowerCase();

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setErr("");
      if (!topicId || !langCode) {
        setLessons([]);
        return;
      }
      try {
        setLoading(true);
        DEBUG &&
          console.groupCollapsed(
            "%c[LessonCard] fetch lessons",
            "color:#0ea5e9;font-weight:700"
          );
        DEBUG &&
          console.log(
            "abbr =",
            langCode,
            "topicId =",
            topicId,
            "slug =",
            topicSlug
          );

        let items = [];

        // 1) Ưu tiên: /topics/{id}/lessons/?include_progress=1
        try {
          const res1 = api.Topics?.lessons
            ? await api.Topics.lessons(
                topicId,
                { include_progress: 1 },
                { signal: controller.signal }
              )
            : await api.get(`/topics/${topicId}/lessons/?include_progress=1`, {
                signal: controller.signal,
              });
          items = Array.isArray(res1?.results)
            ? res1.results
            : Array.isArray(res1)
            ? res1
            : [];
        } catch (e) {
          if (DEBUG)
            console.warn(
              "[LessonCard] Primary fetch (api.Topics.lessons) failed:",
              e?.message
            );
        }

        // 2) Fallback: /lessons/?topic_id=<id>&language_abbr=<abbr> (không có progress; chỉ dùng khi thật cần)
        if ((!items || items.length === 0) && topicId) {
          try {
            const res2 = await api.Lessons.list(
              { topic_id: topicId, language_abbr: langCode, page_size: 200 },
              { signal: controller.signal }
            );
            items = Array.isArray(res2?.results)
              ? res2.results
              : Array.isArray(res2)
              ? res2
              : [];
          } catch (e) {
            if (DEBUG)
              console.warn(
                "[LessonCard] Fallback 1 (topic_id) failed:",
                e?.message
              );
          }
        }

        // 3) Fallback khác: /lessons/?topic=<id>
        if ((!items || items.length === 0) && topicId) {
          try {
            const res3 = await api.Lessons.list(
              { topic: topicId, page_size: 200 },
              { signal: controller.signal }
            );
            items = Array.isArray(res3?.results)
              ? res3.results
              : Array.isArray(res3)
              ? res3
              : [];
          } catch (e) {
            if (DEBUG)
              console.warn(
                "[LessonCard] Fallback 2 (topic) failed:",
                e?.message
              );
          }
        }

        items = [...(items || [])].sort(
          (a, b) => a.order - b.order || a.id - b.id
        );

        if (!cancelled) {
          setLessons(items);
          setCachedLessons(langCode, topicId, items);
        }

        DEBUG &&
          console.table(
            items.map(({ id, order, title, content, progress, locked }) => ({
              id,
              order,
              title,
              type: content?.type,
              percent: progress?.percent,
              locked,
            }))
          );
        DEBUG && console.groupEnd();
      } catch (e) {
        const isNetwork = !e?.response;
        const cached = getCachedLessons(langCode, topicId);
        if (!cancelled) {
          if (cached && cached.length) {
            setLessons(cached);
            setErr("");
          } else {
            setErr(
              isNetwork
                ? "Không thể tải bài học (offline)."
                : e?.message || "Failed to load lessons"
            );
          }
        }
        if (DEBUG) {
          console.group(
            "%c[LessonCard ERROR]",
            "color:#ef4444;font-weight:700"
          );
          console.error(e);
          const r = e?.response;
          if (r) {
            console.log("Status:", r.status);
            console.log("Data:", r.data);
          }
          console.groupEnd();
        }
      } finally {
        !cancelled && setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [topicId, topicSlug, langCode]);

  return (
    <div
      className={`mt-4 rounded-2xl border border-gray-200 bg-white p-4 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">
          Lessons
        </h3>
        <div className="text-xs text-gray-500">{lessons?.length || 0}</div>
      </div>

      {!topicId && (
        <div className="text-sm text-gray-500">
          Chọn một chủ đề để xem bài học.
        </div>
      )}
      {topicId && loading && (
        <div className="text-sm text-gray-500">Đang tải bài học…</div>
      )}
      {topicId && !loading && err && !offline && (
        <div className="flex items-center gap-2 text-sm text-rose-600">
          <AlertCircle size={16} />
          <span>{err}</span>
        </div>
      )}
      {topicId && !loading && offline && lessons?.length > 0 && (
        <div className="mb-2 text-xs rounded-md border border-amber-200 bg-amber-50 text-amber-800 p-2">
          Đang hiển thị bài học từ bộ nhớ tạm (offline).
        </div>
      )}
      {topicId && !loading && !err && lessons?.length === 0 && (
        <div className="text-sm text-gray-500">
          Chưa có bài học cho chủ đề này.
        </div>
      )}

      {topicId && !loading && lessons?.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {lessons.map((ls) => {
            const isReview =
              (ls?.content?.type || "").toLowerCase() === "review";
            const required = Number(ls?.required_pct ?? 80);
            const locked = !!ls?.locked;

            return (
              <button
                key={ls.id}
                onClick={() => {
                  if (locked) {
                    alert(
                      `Bài này đang bị khóa. Cần đạt tối thiểu ${required}% skill của bài trước.`
                    );
                    return;
                  }
                  onOpenLesson?.(ls);
                }}
                className={`group flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left
                           ${
                             locked
                               ? "opacity-60 cursor-not-allowed"
                               : "hover:border-sky-300 hover:bg-sky-50"
                           }`}
                title={ls.title}
                disabled={locked}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-full ${
                        isReview
                          ? "bg-amber-100 text-amber-600"
                          : "bg-sky-100 text-sky-600"
                      }`}
                    >
                      {isReview ? <Repeat size={18} /> : <BookOpen size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 leading-5">
                        {ls.title || (isReview ? "Ôn tập" : `Bài ${ls.order}`)}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {isReview ? "Review" : `Lesson ${ls.order}`} ·{" "}
                        {ls.xp_reward ?? 10} XP ·{" "}
                        {Math.round((ls.duration_seconds ?? 120) / 60)}’
                      </div>
                    </div>
                  </div>

                  {locked && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-[2px] text-[11px] text-gray-600">
                      <Lock size={12} /> Khóa
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
