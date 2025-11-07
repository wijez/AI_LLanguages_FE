import React, { useEffect, useCallback, useState } from "react";
import TitleCard from "../Cards/TitleCard";
import LessonCard from "../Cards/LessonCard";
import { ChatWidget } from "../../chat/test";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  hydrateLearn,
  fetchTopicsSafe,
  setAbbr,
  startLessonSession,
} from "../../store/learnSlice";
import {
  selectAbbr,
  selectTopics,
  selectStatus,
  selectError,
  selectOffline,
} from "../../store/learnSelectors";
import { useNavigate } from "react-router-dom";

const DEBUG = import.meta.env.DEV || localStorage.getItem("debug_api") === "1";

export default function Learn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state (memoized selectors)
  const abbr = useSelector(selectAbbr);
  const topics = useSelector(selectTopics, shallowEqual); // array ref stable if not changed
  const status = useSelector(selectStatus);
  const err = useSelector(selectError);
  const offline = useSelector(selectOffline);

  // UI-only state
  const [startMsg, setStartMsg] = useState("");
  const [expanded, setExpanded] = useState(() => new Set()); // topicIds đã mở

  // Hydrate from cache nhanh, rồi fetch từ BE
  useEffect(() => {
    dispatch(hydrateLearn()).then(() => dispatch(fetchTopicsSafe()));
  }, [dispatch]);

  // Heartbeat auto-retry khi offline (15s)
  useEffect(() => {
    if (!offline) return;
    const id = setInterval(() => dispatch(fetchTopicsSafe({ abbr })), 15000);
    return () => clearInterval(id);
  }, [offline, abbr, dispatch]);

  // Cross-tab language changes → setAbbr
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "learn") {
        const v = (e.newValue || "").split("-")[0].toLowerCase();
        if (v && v !== abbr) dispatch(setAbbr(v));
      }
    };
    const onVisible = () => {
      const v = (localStorage.getItem("learn") || "").split("-")[0].toLowerCase();
      if (v && v !== abbr) dispatch(setAbbr(v));
    };
    const onCustom = (e) => {
      const v = (e?.detail?.abbr || "").split("-")[0].toLowerCase();
      if (v && v !== abbr) dispatch(setAbbr(v));
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("learn:changed", onCustom);
    window.addEventListener("nativeLangChanged", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("learn:changed", onCustom);
      window.removeEventListener("nativeLangChanged", onCustom);
    };
  }, [abbr, dispatch]);

  // Khi abbr đổi → fetch topics (safe)
  useEffect(() => {
    if (abbr) dispatch(fetchTopicsSafe({ abbr }));
  }, [abbr, dispatch]);

  // Start session (offline-friendly)
  const handleStartSession = useCallback(
    async (lesson) => {

      if (lesson?.locked) {
        const req = Number(lesson?.required_pct ?? 80);
        setStartMsg(`Bài này đang bị khóa. Cần đạt tối thiểu ${req}% ở bài trước.`);
        setTimeout(() => setStartMsg(''), 3500);
        return;
      }
      try {
        const res = await dispatch(startLessonSession({ lessonId: lesson.id })).unwrap();
        navigate(`/learn/session/${res.id}`);
      } catch (e) {
        const detail = e?.detail || e?.message || 'Không thể tạo phiên học lúc này.';
        setStartMsg(detail);
        setTimeout(() => setStartMsg(""), 3500);
        if (DEBUG) console.error("[Learn] start session error:", e);
      }
    },
    [dispatch, navigate]
  );

  // Toggle 1 topic
  const toggle = useCallback((topicId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  if (status === "loading" && !topics.length) {
    return <div className="p-8 text-slate-500 text-sm">Đang tải chủ đề…</div>;
  }

  return (
    <div className="relative p-8 w-full max-w-[1100px] mx-auto min-h-[calc(100vh-0px)]">
      

      {/* Trạng thái */}
      {status === "refreshing" && (
        <div className="mt-2 text-slate-500 text-sm">Đang cập nhật chủ đề…</div>
      )}
      {offline && (
        <div className="mt-2 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-800 p-3">
          Hiển thị dữ liệu từ bộ nhớ tạm (offline). Hệ thống sẽ tự thử đồng bộ lại.
        </div>
      )}
      {!offline && err && (
        <div className="mt-2 text-sm rounded-lg border border-rose-200 bg-rose-50 text-rose-600 p-3">
          Lỗi: {String(err)}
        </div>
      )}
      {startMsg && (
        <div className="mt-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700 p-3">
          {startMsg}
        </div>
      )}

      {/* Danh sách TẤT CẢ topics */}
      <div className="mt-4 space-y-6">
        {topics.map((t) => {
          const isOpen = expanded.has(t.id);
          return (
            <section key={t.id} className="rounded-2xl border border-gray-200 bg-white">
              {/* Title của từng topic */}
              <div className="p-4">
                <TitleCard
                  topic={t}
                  sectionPrefix="CHỦ ĐỀ"
                  floating={false}
                  center={false}
                  onBack={undefined}
                  onHelp={() => dispatch(fetchTopicsSafe({ abbr }))}
                  cta={
                    <button
                      onClick={() => toggle(t.id)}
                      className="rounded-lg bg-fuchsia-600 text-white text-sm px-3 py-1.5 hover:bg-fuchsia-700 active:scale-[0.98]"
                    >
                      {isOpen ? "Ẩn bài học" : "Xem bài học"}
                    </button>
                  }
                />
              </div>

              {/* Lessons của topic (lazy load khi mở) */}
              {isOpen && (
                <div className="px-4 pb-4">
                  <LessonCard topic={t} onOpenLesson={handleStartSession} />
                </div>
              )}
            </section>
          );
        })}

        {!topics.length && (
          <div className="text-sm text-slate-500">Chưa có chủ đề cho ngôn ngữ này.</div>
        )}
      </div>

      <ChatWidget />
    </div>
  );
}
