import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resumeLessonSession } from "../../store/learnSlice";
import { api } from "../../api/api";
import {
  Loader2,
  BookOpen,
  Bug,
  Target,
  Mic,
  Headphones,
  ListChecks,
  Sparkles,
  Trophy,
  ArrowRight,
  History,
  X // Icon đóng Modal
} from "lucide-react";

// --- IMPORT COMPONENT CHAT ---
// Lưu ý: Đảm bảo đường dẫn này đúng với cấu trúc dự án của bạn
// Ví dụ: nếu file nằm ở src/pages/roleplay/RoleplayChatDemo.jsx thì sửa lại import
import RoleplayChatDemo from "../chat/RoleplayChatDemo"; 

const clsx = (...xs) => xs.filter(Boolean).join(" ");
const getLang = () =>
  typeof window !== "undefined" ? localStorage.getItem("learn") || "en" : "en";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [startMsg, setStartMsg] = React.useState("");

  // --- STATE CHO MODAL ROLEPLAY ---
  const [showRoleplayModal, setShowRoleplayModal] = React.useState(false);
  const [loadingRoleplay, setLoadingRoleplay] = React.useState(false);

  const lang = getLang();

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    api.Practice.overview({ language: lang, limit: 10 })
      .then((d) => {
        if (!alive) return;
        setData(d || {});
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.response?.data?.detail || e?.message || "Load failed");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [lang, location.key]);

  const handleResumeSession = async (sessionId) => {
    if (!sessionId) return;

    try {
      await dispatch(resumeLessonSession({ sessionId })).unwrap();
      navigate(`/learn/session/${sessionId}`, {
        state: {
          from: "practice",
          mode: "resume",
        },
      });
    } catch (e) {
      console.error("Resume error:", e);
      setStartMsg("Không thể khôi phục bài học. Vui lòng thử lại sau.");
      setTimeout(() => setStartMsg(""), 3000);
    }
  };

  const handleStartSkill = async (skillId) => {
    if (!data?.enrollment?.id || !skillId) {
      setStartMsg("Thiếu thông tin khóa học hoặc kỹ năng.");
      return;
    }

    try {
      const res = await api.SkillSessions.start({
        skill: skillId,
        enrollment: data.enrollment.id,
      });

      navigate(`/learn/session/${res.id}?mode=skill`, {
        state: { from: "practice" },
      });
    } catch (e) {
      console.error(e);
      setStartMsg(e?.detail || e?.message || "Không thể tạo bài luyện tập.");
      setTimeout(() => setStartMsg(""), 3000);
    }
  };

  // --- CẬP NHẬT: MỞ MODAL THAY VÌ NAVIGATE ---
  const handleStartRoleplay = async (sessionItem) => {
    // sessionItem: { id, title, role, updated_at, ... }
    if (!sessionItem?.id) return;

    try {
      setLoadingRoleplay(true); // Hiển thị loading trong lúc fetch

      // 1. Gọi API resume để lấy lại lịch sử chat
      const res = await api.RoleplaySession.resume(sessionItem.id);

      // 2. Chuyển đổi history_log (từ API) sang định dạng MessageBubble UI
      const historyMsgs = (res.history_log || []).flatMap((turn, idx) => {
        const textContent = Array.isArray(turn.parts) 
            ? turn.parts.join(" ") 
            : (turn.parts || "");
            
        if (turn.role === "user") {
           return [{
             id: `restored-${idx}-u`,
             role: res.role || "student_b",
             text: textContent,
             side: "right",
           }];
        } else if (turn.role === "model") {
           return [{
             id: `restored-${idx}-m`,
             role: "assistant",
             text: textContent,
             side: "left",
           }];
        }
        return [];
      });

      // 3. Lưu trạng thái vào localStorage
      // RoleplayChatDemo sẽ đọc key 'roleplay_practice_session' khi khởi tạo để khôi phục
      const stateToSave = {
        mode: "practice",
        scenario: res.scenario_slug,
        userRole: res.role,
        sessionId: res.id,
        historyMessages: historyMsgs,
        timestamp: Date.now(),
      };

      localStorage.setItem("roleplay_practice_session", JSON.stringify(stateToSave));

      // 4. Mở Modal
      setShowRoleplayModal(true);

    } catch (e) {
      console.error("Resume error:", e);
      setStartMsg("Không thể tải lại hội thoại. Vui lòng thử lại.");
      setTimeout(() => setStartMsg(""), 3000);
    } finally {
      setLoadingRoleplay(false);
    }
  };

  const handleStartReview = async (type) => {
    setStartMsg(`Tính năng ôn tập ${type} đang được phát triển.`);
    setTimeout(() => setStartMsg(""), 2000);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Header />
        <SkeletonGrid />
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <Header />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {String(err)}
        </motion.div>
      </div>
    );
  }

  const {
    enrollment,
    xp_today,
    daily_goal,
    srs_due_words,
    word_suggestions,
    common_mistakes,
    weak_skills,
    micro_lessons,
    speak_listen,
  } = data || {};

  const progress = Math.min(
    100,
    Math.round(((xp_today || 0) * 100) / Math.max(1, daily_goal || 1))
  );

  const noSRS = !srs_due_words || srs_due_words.length === 0;
  const vocabPreview =
    noSRS && word_suggestions ? word_suggestions.slice(0, 8) : [];

  return (
    <div className="p-6 relative">
      <Header />

      <AnimatePresence>
        {startMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-24 left-1/2 z-50 text-sm rounded-xl border border-red-200 bg-red-50 text-red-700 px-6 py-3 shadow-lg flex items-center gap-2"
          >
            <span>⚠️</span> {startMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={containerVariants}
        >
          {/* --- Phần Progress & Cards --- */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border bg-white p-5 mt-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              <div className="font-semibold">Tiến độ hôm nay</div>
              <div className="ml-auto text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                {enrollment?.language_code?.toUpperCase?.()}
              </div>
            </div>
            <div className="mt-4">
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-600 flex justify-between">
                <span>
                  Đã đạt: <b>{xp_today || 0}</b> XP
                </span>
                <span>Mục tiêu: {daily_goal || 0} XP</span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {/* ... (Các Card khác giữ nguyên: Ôn từ, Gợi ý, Lỗi sai, Kỹ năng, Bài học dở) ... */}
            
            <Card
              title="Ôn từ đến hạn"
              icon={<BookOpen className="text-blue-600" />}
              actionText="Bắt đầu ôn"
              onAction={() => handleStartReview("srs")}
            >
              <ul className="text-sm space-y-2">
                {(srs_due_words || []).slice(0, 8).map((kw) => (
                  <li key={kw.id} className="flex items-center justify-between group cursor-default">
                    <div className="truncate">
                      <span className="font-medium group-hover:text-blue-600 transition-colors">
                        {kw.word?.text}
                      </span>
                      {kw.word?.ipa ? (
                        <span className="ml-2 text-gray-400 text-xs font-mono">/{kw.word.ipa}/</span>
                      ) : null}
                    </div>
                  </li>
                ))}
                {noSRS && vocabPreview.map((w) => (
                    <li key={`pv_${w.id}`} className="flex items-center justify-between opacity-75">
                      <span className="font-medium">{w.text}</span>
                    </li>
                  ))}
                {noSRS && !vocabPreview.length && <EmptyLine text="Không có từ cần ôn." />}
              </ul>
            </Card>

            <Card
              title="Từ vựng gợi ý"
              icon={<Sparkles className="text-purple-600" />}
            >
              <ul className="text-sm space-y-2">
                {(word_suggestions || []).slice(0, 8).map((w) => (
                  <li key={w.id} className="flex items-center justify-between">
                    <span className="font-medium">{w.text}</span>
                    {w.level && (
                      <span className="text-[10px] rounded-sm px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold">
                        {w.level}
                      </span>
                    )}
                  </li>
                ))}
                {(!word_suggestions || word_suggestions.length === 0) && (
                  <EmptyLine text="Chưa có gợi ý từ vựng." />
                )}
              </ul>
            </Card>

            <Card
              title="Ôn lỗi hay sai"
              icon={<Bug className="text-red-500" />}
              actionText="Sửa ngay"
              onAction={() => handleStartReview("mistakes")}
            >
              <ul className="text-sm space-y-2">
                {(common_mistakes || []).slice(0, 8).map((m, i) => (
                  <li key={`${m.word_id || "no"}_${i}`} className="flex items-center justify-between">
                    <div className="truncate flex flex-col">
                      <span className="font-medium text-red-900 bg-red-50 px-2 py-0.5 rounded-md w-fit">
                        {m.word_text || `#${m.word_id || "-"}`}
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5 ml-0.5">{m.error_type}</span>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      {m.times}×
                    </span>
                  </li>
                ))}
                {(!common_mistakes || common_mistakes.length === 0) && (
                  <EmptyLine text="Chưa có lỗi nổi bật." />
                )}
              </ul>
            </Card>

            <Card
              title="Tỷ lệ lỗi theo kỹ năng"
              icon={<Target className="text-orange-500" />}
              actionText="Luyện ngay"
              onAction={() => weak_skills?.[0] && handleStartSkill(weak_skills[0].skill_id)}
            >
              <div className="space-y-3">
                {(weak_skills || []).map((w) => (
                  <div key={w.skill_tag} onClick={() => handleStartSkill(w.skill_id)} className="group hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium capitalize text-gray-700 group-hover:text-orange-600 transition-colors">
                        {w.skill_tag}
                      </span>
                      <span className="text-xs font-bold text-gray-500">{Math.round((w.accuracy || 0) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={clsx("h-1.5 rounded-full", (w.accuracy || 0) < 0.5 ? "bg-red-500" : "bg-orange-500")}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((w.accuracy || 0) * 100)}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
                {(!weak_skills || weak_skills.length === 0) && (
                  <EmptyLine text="Độ chính xác các kỹ năng ổn định." />
                )}
              </div>
            </Card>

            <Card
              title="Bài học đang dở"
              icon={<ListChecks className="text-green-600" />}
              actionText="Tiếp tục"
              onAction={() => micro_lessons?.[0] && handleResumeSession(micro_lessons[0].id)}
            >
              <ul className="text-sm space-y-2">
                {(micro_lessons || []).slice(0, 6).map((s) => (
                  <li key={s.id} onClick={() => handleResumeSession(s.id)} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer group">
                    <span className="truncate font-medium text-gray-700 group-hover:text-green-800">
                      {s.lesson?.title || `Lesson #${s.lesson?.id}`}
                    </span>
                    <ArrowRight size={14} className="text-gray-400 group-hover:text-green-600" />
                  </li>
                ))}
                {(!micro_lessons || micro_lessons.length === 0) && (
                  <EmptyLine text="Không có bài đang dở." />
                )}
              </ul>
            </Card>

            {/* --- CARD LỊCH SỬ ROLEPLAY --- */}
            <Card
              title="Lịch sử Roleplay"
              icon={<History className="text-pink-500" />}
              actionText="Tiếp tục"
              onAction={() => speak_listen?.[0] && handleStartRoleplay(speak_listen[0])}
            >
              {/* Thêm max-h (chiều cao tối đa) và overflow-y-auto (cuộn dọc) */}
              <ul className="text-sm space-y-2 max-h-[300px] overflow-y-auto pr-1  scrollbar-hide">
                {/* HIỂN THỊ LOADING TRONG CARD */}
                {loadingRoleplay && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-2xl backdrop-blur-[1px]">
                    <Loader2 className="animate-spin text-pink-600" />
                  </div>
                )}
                
                {(speak_listen || []).map((session) => (
                  <li
                    key={session.id}
                    onClick={() => !loadingRoleplay && handleStartRoleplay(session)}
                    className="flex items-center justify-between p-1.5 hover:bg-gray-50 rounded transition-colors cursor-pointer group relative"
                  >
                    <div className="flex flex-col overflow-hidden min-w-0 pr-2">
                        <span className="truncate font-medium text-gray-800 group-hover:text-pink-600 transition-colors">
                            {/* Lưu ý: Bạn nên dùng scenario_title nếu backend đã trả về, system_context thường rất dài */}
                            {session.system_context || "Untitled Session"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                            {session.updated_at && (
                                <span>
                                    {new Date(session.updated_at).toLocaleDateString("vi-VN", {
                                        day: '2-digit', month: '2-digit'
                                    })}
                                </span>
                            )}
                            {session.role && (
                                <>
                                    <span>•</span>
                                    <span className="uppercase">{session.role.replace("student_", "")}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded bg-gray-50 whitespace-nowrap">
                      {session.level || "ALL"}
                    </span>
                  </li>
                ))}
                {(!speak_listen || speak_listen.length === 0) && (
                  <EmptyLine text="Chưa có lịch sử luyện tập." />
                )}
              </ul>
            </Card>
            <CTA />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* --- MODAL DIALOG ROLEPLAY --- */}
      <AnimatePresence>
        {showRoleplayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowRoleplayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()} 
              className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Nút đóng */}
              <button 
                onClick={() => setShowRoleplayModal(false)}
                className="absolute top-3 right-3 z-10 p-2 bg-white/80 rounded-full hover:bg-slate-100 text-slate-500 hover:text-red-500 transition-colors shadow-sm backdrop-blur"
              >
                <X size={20} />
              </button>

              {/* Nhúng RoleplayChatDemo chế độ embedded */}
              <RoleplayChatDemo embedded={true} autoStart={true} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-50 rounded-xl">
          <Sparkles className="text-yellow-500" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Trung tâm Luyện tập
          </h1>
          <p className="text-sm text-gray-500">
            Cải thiện điểm yếu và duy trì thói quen hàng ngày.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Card({ title, icon, children, actionText, onAction }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      }}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="font-bold text-gray-800">{title}</div>
        {actionText ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onAction && onAction();
            }}
            className="ml-auto text-xs font-medium px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            {actionText}
          </motion.button>
        ) : null}
      </div>
      <div className="flex-1 flex flex-col">{children}</div>
    </motion.div>
  );
}

function EmptyLine({ text }) {
  return (
    <div className="text-sm text-gray-400 italic py-4 text-center">{text}</div>
  );
}

function CTA() {
  return (
    <motion.div
      variants={itemVariants}
      className="md:col-span-2 xl:col-span-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 flex items-center gap-4 shadow-sm"
    >
      <div className="p-3 bg-white rounded-full shadow-sm text-indigo-600">
        <Headphones size={24} />
      </div>
      <div>
        <div className="font-bold text-indigo-900">Mẹo luyện tập</div>
        <div className="text-sm text-indigo-700/80 mt-1">
          Luyện mỗi kỹ năng <strong>3–5 phút</strong> giúp não bộ ghi nhớ tốt
          hơn học nhồi nhét. Hoàn thành Daily Goal để nhận thêm XP bonus!
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border bg-white p-4 h-48 flex items-center justify-center text-gray-400"
        >
          <Loader2 className="animate-spin mr-2" /> Đang tải dữ liệu...
        </div>
      ))}
    </motion.div>
  );
}