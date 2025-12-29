import React, { useEffect, useCallback, useState } from "react";
import TitleCard from "../Cards/TitleCard";
import LessonCard from "../Cards/LessonCard";
import RecommendationBanner from "../Cards/RecommendationBanner";
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
  selectOffline,
} from "../../store/learnSelectors";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";     // API Core (Lessons, Skills, Sessions)
import { aiApi } from "../../api/aiApi"; // API AI (Recommendations)

export default function Learn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- REDUX STATE ---
  const abbr = useSelector(selectAbbr);
  const topics = useSelector(selectTopics, shallowEqual);
  const status = useSelector(selectStatus);
  const offline = useSelector(selectOffline);

  // --- UI STATE ---
  const [startMsg, setStartMsg] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());

  // --- AI RECOMMENDATION STATE ---
  const [recLesson, setRecLesson] = useState(null); // Object Lesson
  const [recSkill, setRecSkill] = useState(null);   // Object Skill
  const [recReason, setRecReason] = useState([]);
  const [recType, setRecType] = useState("practice");
  
  // Loading flags
  const [loadingRec, setLoadingRec] = useState(false); 
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Init Data
  useEffect(() => {
    dispatch(hydrateLearn()).then(() => dispatch(fetchTopicsSafe()));
  }, [dispatch]);
  
  // 2. Heartbeat Sync
  useEffect(() => {
    if (!offline) return;
    const id = setInterval(() => dispatch(fetchTopicsSafe({ abbr })), 15000);
    return () => clearInterval(id);
  }, [offline, abbr, dispatch]);

  // 3. Storage Sync
  useEffect(() => {
     const onStorage = (e) => {
      if (e.key === "learn") {
        const v = (e.newValue || "").split("-")[0].toLowerCase();
        if (v && v !== abbr) dispatch(setAbbr(v));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [abbr, dispatch]);


  // --- A. GET RECOMMENDATION (FETCH ON DEMAND) ---
  const getExistingRecommendations = useCallback(async (langAbbr) => {
    if (offline || !langAbbr) return;
    setLoadingRec(true);
    
    try {
      // B1: Lấy Enrollment ID
      const resp = await api.Enrollments.findByAbbr(langAbbr);
      const list = Array.isArray(resp) ? resp : resp?.results;
      const enrollmentData = list?.[0];

      if (!enrollmentData?.id) {
        setRecLesson(null); setRecSkill(null);
        return;
      }

      // B2: Gọi API AI lấy 1 Recommendation
      // (Backend đã cấu hình sort, sẽ lấy cái phù hợp nhất)
      const recsResp = await aiApi.Recommendations.list({
        enrollment_id: enrollmentData.id,
        limit: 5, 
      });
      
      const recList = Array.isArray(recsResp) ? recsResp : recsResp?.results;
      const latestRec = recList?.[0];

      if (latestRec) {
        // Cập nhật thông tin text
        setRecReason(latestRec.reasons || []);
        setRecType(latestRec.rec_type || "practice");

        // B3: Gọi API chi tiết song song (Lesson & Skill)
        const promises = [];
        
        // Fetch Lesson
        if (latestRec.lesson_id) {
            promises.push(
                api.Lessons.get(latestRec.lesson_id)
                    .then(data => setRecLesson(data))
                    .catch(() => setRecLesson(null))
            );
        } else {
            setRecLesson(null);
        }

        // Fetch Skill
        if (latestRec.skill_id) {
            promises.push(
                api.Skills.get(latestRec.skill_id)
                    .then(data => setRecSkill(data))
                    .catch(() => setRecSkill(null))
            );
        } else {
            setRecSkill(null);
        }

        await Promise.all(promises);

      } else {
        setRecLesson(null); setRecSkill(null);
      }

    } catch (e) {
      console.warn("[Learn] AI Fetch failed:", e);
    } finally {
      setLoadingRec(false);
    }
  }, [offline]);


  // --- B. AUTO FETCH TRÊN LOAD ---
  useEffect(() => {
    if (abbr) {
      getExistingRecommendations(abbr);
    }
  }, [abbr, getExistingRecommendations]);


  // --- C. GENERATE NEW ---
  const handleGenerateNew = async () => {
    if (offline || !abbr) return;
    setIsGenerating(true);

    try {
      const resp = await api.Enrollments.findByAbbr(abbr);
      const list = Array.isArray(resp) ? resp : resp?.results;
      const enrollmentData = list?.[0];

      if (!enrollmentData?.id) {
         setStartMsg("Không tìm thấy thông tin khóa học.");
         return;
      }

      // Gọi API AI tạo mới
      await aiApi.Recommendations.generate({
        enrollment_id: enrollmentData.id,
        language: abbr,
        top_k_skills: 3, 
        top_n_words: 10
      });
      
      // Refresh UI
      await getExistingRecommendations(abbr);

    } catch (e) {
      console.error("AI Generate failed:", e);
      setStartMsg("AI đang bận, vui lòng thử lại sau.");
      setTimeout(() => setStartMsg(""), 3000);
    } finally {
      setIsGenerating(false);
    }
  };


  // --- D. HANDLE START SESSION (QUAN TRỌNG NHẤT) ---
  const handleStartSession = useCallback(async (lesson, skillToPractice = null) => {
        if (!lesson) return;
        
        // 1. Check Locked
        if (lesson.locked) {
            const req = Number(lesson.required_pct ?? 80);
            setStartMsg(`Bài này đang bị khóa. Cần hoàn thành bài trước.`);
            setTimeout(() => setStartMsg(""), 3500);
            return;
        }

        try {
            // TRƯỜNG HỢP 1: LUYỆN SKILL (Từ Banner có Skill)
            if (skillToPractice) {
                // Cần lấy Enrollment ID
                const me = await api.Enrollments.me();
                const list = Array.isArray(me) ? me : me?.results;
                // Tìm enrollment khớp abbr hiện tại
                const enrollment = list?.find(e => 
                    (e.language?.abbreviation || e.language?.code) === abbr
                ) || list?.[0];

                if (!enrollment) throw new Error("Không tìm thấy khóa học.");

                // Gọi API tạo Skill Session
                const res = await api.SkillSessions.start({ 
                    skill: skillToPractice.id, 
                    enrollment: enrollment.id 
                });
                
                // Điều hướng sang trang làm bài (Giả sử dùng chung Viewer hoặc có Route riêng)
                // Lưu ý: Kiểm tra route "/learn/session/:id" của bạn có hỗ trợ hiển thị skill không
                navigate(`/learn/session/${res.id}?mode=skill`); 
            } 
            
            // TRƯỜNG HỢP 2: HỌC BÀI HỌC (Từ List hoặc Banner không có Skill)
            else {
                const res = await dispatch(startLessonSession({ lessonId: lesson.id })).unwrap();
                navigate(`/learn/session/${res.id}`);
            }

        } catch (e) {
            console.error(e);
            setStartMsg(e?.detail || e?.message || "Không thể tạo phiên học.");
            setTimeout(() => setStartMsg(""), 3500);
        }
    }, [dispatch, navigate, abbr]);

  // UI Helpers
  const toggle = useCallback((topicId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  if (status === "loading" && !topics.length) {
    return <div className="p-8 text-slate-500 text-sm animate-pulse">Đang tải dữ liệu học tập...</div>;
  }

  return (
    <div className="relative p-6 md:p-8 w-full max-w-[1100px] mx-auto min-h-screen pb-20">
      {/* Toast Notification */}
      {startMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 text-sm rounded-xl border border-red-200 bg-red-50 text-red-700 px-6 py-3 shadow-lg animate-fadeIn flex items-center gap-2">
          <span>⚠️</span> {startMsg}
        </div>
      )}

      {/* --- BANNER --- */}
      {!offline && abbr && (
        <RecommendationBanner
          lesson={recLesson}
          skill={recSkill}     // Truyền skill xuống Banner
          loading={loadingRec}
          isGenerating={isGenerating}
          reasoning={recReason}
          recType={recType}
          onStart={handleStartSession} // Hàm này giờ nhận (lesson, skill)
          onGenerate={handleGenerateNew}
        />
      )}

      {/* --- TOPICS LIST --- */}
      <div className="mt-6 space-y-6">
        {topics.map((t) => {
            const isOpen = expanded.has(t.id);
            return (
                <section key={t.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="p-4">
                        <TitleCard 
                            topic={t} 
                            sectionPrefix="CHỦ ĐỀ" 
                            floating={false} 
                            center={false}
                            onHelp={() => dispatch(fetchTopicsSafe({ abbr }))}
                            cta={
                                <button
                                onClick={() => toggle(t.id)}
                                className={`rounded-lg text-sm px-4 py-2 font-medium transition-colors ${
                                    isOpen 
                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                    : "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                                }`}
                                >
                                {isOpen ? "Thu gọn" : "Xem bài học"}
                                </button>
                            }
                        />
                    </div>
                    {isOpen && (
                        <div className="px-4 pb-4 border-t border-slate-100 pt-4 animate-fadeIn">
                            <LessonCard topic={t} onOpenLesson={handleStartSession} />
                        </div>
                    )}
                </section>
            );
        })}
      </div>
    </div>
  );
}