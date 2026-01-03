import React, { useEffect, useCallback, useState } from "react";
import TitleCard from "../Cards/TitleCard";
import LessonCard from "../Cards/LessonCard";
import RecommendationBanner from "../Cards/RecommendationBanner";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  hydrateLearn,
  fetchTopicsSafe,
  setAbbr,
} from "../../store/learnSlice";
import {
  selectAbbr,
  selectTopics,
  selectStatus,
  selectOffline,
} from "../../store/learnSelectors";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";     
import { aiApi } from "../../api/aiApi"; 

export default function Learn() {
  const { t } = useTranslation(['learn', 'common']);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const abbr = useSelector(selectAbbr);
  const topics = useSelector(selectTopics, shallowEqual);
  const status = useSelector(selectStatus);
  const offline = useSelector(selectOffline);

  const [startMsg, setStartMsg] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());

  // --- AI RECOMMENDATION STATE ---
  const [recLesson, setRecLesson] = useState(null); 
  const [recSkill, setRecSkill] = useState(null);   
  const [recReason, setRecReason] = useState([]);
  const [recType, setRecType] = useState("practice");
  const [recId, setRecId] = useState(null); 
  const [loadingRec, setLoadingRec] = useState(false); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [allRecs, setAllRecs] = useState([]);

  useEffect(() => {
    dispatch(hydrateLearn()).then(() => dispatch(fetchTopicsSafe()));
  }, [dispatch]);
  
  useEffect(() => {
    if (!offline) return;
    const id = setInterval(() => dispatch(fetchTopicsSafe({ abbr })), 15000);
    return () => clearInterval(id);
  }, [offline, abbr, dispatch]);

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

  const getExistingRecommendations = useCallback(async (langAbbr) => {
    if (offline || !langAbbr) return;
    setLoadingRec(true);
    
    try {
      const resp = await api.Enrollments.findByAbbr(langAbbr);
      const list = Array.isArray(resp) ? resp : resp?.results;
      const enrollmentData = list?.[0];

      if (!enrollmentData?.id) {
        setRecLesson(null); 
        setRecSkill(null);
        return;
      }

      const recsResp = await aiApi.Recommendations.latest()
      // .list({
      //   enrollment_id: enrollmentData.id,
      //   limit: 5,
      // });
      
      const recList = Array.isArray(recsResp) ? recsResp : recsResp?.results;
      const latestRec = recList?.[0];
      const validList = (recList || []).filter(item => item.lesson_id || item.skill_id);
      setAllRecs(validList);
      if (latestRec) {
        setRecId(latestRec.id);
        setRecReason(latestRec.reasons || []);
        setRecType(latestRec.rec_type || "practice");

        const promises = [];
        
        if (latestRec.lesson_id) {
            promises.push(
                api.Lessons.get(latestRec.lesson_id)
                    .then(data => setRecLesson(data))
                    .catch(() => setRecLesson(null))
            );
        } else {
            setRecLesson(null);
        }

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
        setRecLesson(null); 
        setRecSkill(null);
      }

    } catch (e) {
      console.warn("[Learn] AI Fetch failed:", e);
    } finally {
      setLoadingRec(false);
    }
  }, [offline]);

  useEffect(() => {
    if (abbr) {
      getExistingRecommendations(abbr);
    }
  }, [abbr, getExistingRecommendations]);

  const handleGenerateNew = async () => {
    if (offline || !abbr) return;
    setIsGenerating(true);

    try {
      const resp = await api.Enrollments.findByAbbr(abbr);
      const list = Array.isArray(resp) ? resp : resp?.results;
      const enrollmentData = list?.[0];

      if (!enrollmentData?.id) {
         setStartMsg(t('learn:enrollment_not_found', { defaultValue: 'Không tìm thấy thông tin khóa học.' }));
         return;
      }

      await aiApi.Recommendations.generate({
        enrollment_id: enrollmentData.id,
        language: abbr,
        top_k_skills: 3, 
        top_n_words: 10
      });
      
      await getExistingRecommendations(abbr);

    } catch (e) {
      console.error("AI Generate failed:", e);
      setStartMsg(t('learn:ai_busy_msg', { defaultValue: 'AI đang bận, vui lòng thử lại sau.' }));
      setTimeout(() => setStartMsg(""), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- HÀM START SESSION DUY NHẤT ---
  const handleStartSession = useCallback(async (lesson, skillToPractice = null) => {
    if (!lesson && !skillToPractice) return;

    if (lesson?.locked && !skillToPractice) {
        setStartMsg(t('learn:lesson_locked_msg', { defaultValue: 'Bài này đang bị khóa.' }));
        return;
    }

    try {
        const me = await api.Enrollments.me();
        const list = Array.isArray(me) ? me : me?.results;
        const enrollment = list?.find(e => 
            (e.language?.abbreviation || e.language?.code)?.toLowerCase() === abbr?.toLowerCase()
        ) || list?.[0];

        if (!enrollment) throw new Error(t('learn:enrollment_not_found'));

        // Chuẩn bị payload chung cho LearningSessions.start
        const payload = {
            lesson: lesson.id,
            enrollment: enrollment.id,
        };

        // Nếu là Luyện Kỹ Năng từ AI -> Gửi kèm skill_id & rec_id
        if (skillToPractice) {
            payload.skill_id = skillToPractice.id;
            if (recId) payload.recommendation_id = recId;
        }

        // Gọi API duy nhất
        const res = await api.LearningSessions.start(payload);
        const sessionId = res.id || res.session?.id;

        if (!sessionId) throw new Error("Lỗi ID phiên học");

        // Điều hướng thẳng (Backend đã xử lý việc lọc skill nếu có skill_id)
        navigate(`/learn/session/${sessionId}`);

    } catch (e) {
        console.error("Start Session Error:", e);
        const msg = e?.response?.data?.detail || "Không thể bắt đầu bài học.";
        setStartMsg(msg);
        setTimeout(() => setStartMsg(""), 3000);
    }
  }, [dispatch, navigate, abbr, t, recId]);

  const toggle = useCallback((topicId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  if (status === "loading" && !topics.length) {
    return (
        <div className="p-8 text-slate-500 text-sm animate-pulse">
            {t('learn:loading_data', { defaultValue: 'Đang tải dữ liệu học tập...' })}
        </div>
    );
  }

  return (
    <div className="relative p-6 md:p-8 w-full max-w-[1100px] mx-auto min-h-screen pb-20">
      {startMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 text-sm rounded-xl border border-red-200 bg-red-50 text-red-700 px-6 py-3 shadow-lg animate-fadeIn flex items-center gap-2">
           {startMsg}
        </div>
      )}

      {!offline && abbr && (
        <RecommendationBanner
          lesson={recLesson}
          skill={recSkill}     
          loading={loadingRec}
          isGenerating={isGenerating}
          reasoning={recReason}
          recType={recType}
          onStart={handleStartSession}  // Sử dụng hàm start chung
          onGenerate={handleGenerateNew}
        />
      )}
      {allRecs.length > 1 && !loadingRec && !isGenerating && (
  <div className="mb-8 animate-fadeIn">
    <h3 className="mb-3 text-sm font-bold text-slate-500 uppercase tracking-wider px-1">
      {t('learn:other_suggestions', { defaultValue: 'Lựa chọn khác cho bạn' })}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {allRecs.slice(1).map((rec, idx) => { 
        
        return (
          <div 
            key={rec.id} 
            onClick={() => {
                const miniLesson = { id: rec.lesson_id, locked: false };
                const miniSkill = rec.skill_id ? { id: rec.skill_id } : null;
                handleStartSession(miniLesson, miniSkill);
            }}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-violet-300 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="flex flex-col">
               <span className="font-semibold text-slate-700 group-hover:text-violet-700">
                  {rec.rec_type === 'review' ? "Ôn tập kỹ năng" : "Bài học tiếp theo"}
               </span>
               <span className="text-xs text-slate-500 mt-1 flex gap-2">
                 {rec.reasons?.[0] && (
                    <span className="bg-slate-100 px-1.5 rounded text-slate-600">
                       💡 {rec.reasons[0].replace('AI: ', '')}
                    </span>
                 )}
                 <span className="text-violet-600 font-bold text-[10px] bg-violet-50 px-1.5 rounded border border-violet-100">
                    {Math.round(rec.priority_score * 100)}% match
                 </span>
               </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}

      <div className="mt-6 space-y-6">
        {topics.map((tData) => {
            const isOpen = expanded.has(tData.id);
            return (
                <section key={tData.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="p-4">
                        <TitleCard 
                            topic={tData} 
                            sectionPrefix={t('learn:topic_prefix')} 
                            floating={false} 
                            center={false}
                            onHelp={() => dispatch(fetchTopicsSafe({ abbr }))}
                            cta={
                                <button
                                onClick={() => toggle(tData.id)}
                                className={`rounded-lg text-sm px-4 py-2 font-medium transition-colors ${
                                    isOpen 
                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                    : "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                                }`}
                                >
                                {isOpen ? t('learn:collapse') : t('learn:view_lessons')}
                                </button>
                            }
                        />
                    </div>
                    {isOpen && (
                        <div className="px-4 pb-4 border-t border-slate-100 pt-4 animate-fadeIn">
                            <LessonCard 
                                topic={tData} 
                                onOpenLesson={(lesson) => handleStartSession(lesson, null)} // Gọi start lesson
                            />
                        </div>
                    )}
                </section>
            );
        })}
      </div>
    </div>
  );
}