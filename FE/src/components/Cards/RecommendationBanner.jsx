import React, { useState } from "react";
import { Sparkles, Play, Zap, RefreshCw, CheckCircle2, Target, BookOpen } from "lucide-react"; 

export default function RecommendationBanner({ 
  lesson, 
  skill,         
  loading, 
  onStart,       
  onGenerate, 
  reasoning,     
  recType,       
  isGenerating
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (loading || isGenerating) {
    return (
      <div className="mb-6 p-6 rounded-2xl bg-white border border-violet-100 shadow-sm h-44 animate-pulse relative overflow-hidden">
         <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
         <div className="space-y-3 mt-4">
            <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
            <div className="h-8 w-2/3 bg-slate-200 rounded-lg"></div>
         </div>
      </div>
    );
  }

  if (!lesson && !skill) {
    return (
        <div className="mb-6 p-8 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 flex flex-col items-center justify-center text-center">
            <button onClick={onGenerate} disabled={isGenerating} className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-all font-medium">
                <Zap className="w-4 h-4 fill-current" />
                Phân tích lộ trình học
            </button>
        </div>
    );
  }

  const reasonsList = Array.isArray(reasoning) ? reasoning : (reasoning ? [reasoning] : []);

  return (
    <div className="mb-6 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-xl shadow-violet-200 transition-all hover:shadow-violet-300">
      <div className="p-6 md:p-8 relative z-10">
        <div className="flex justify-between items-start mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 text-xs font-bold uppercase backdrop-blur-md bg-white/20">
                <Sparkles className="w-3 h-3"/> <span>Gợi ý hôm nay</span>
            </div>
            <button onClick={onGenerate} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold mb-1 leading-tight">
                    {skill ? skill.title : lesson.title}
                </h3>
                {skill && lesson && (
                    <p className="text-violet-200 text-sm font-medium mb-2">Trong bài: {lesson.title}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-violet-100">
                    {reasonsList.map((r, i) => (
                        <span key={i} className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3"/> {r}</span>
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                {/* 1. Nút Luyện Kỹ Năng (Nếu có Skill) */}
                {skill && (
                    <button
                        onClick={() => onStart(lesson, skill)} // Gọi start với tham số skill
                        className="flex items-center justify-center gap-2 bg-white text-violet-700 hover:bg-violet-50 active:scale-95 transition-all font-bold py-3 px-5 rounded-xl shadow-lg"
                    >
                        <Target className="w-5 h-5" />
                        Luyện Kỹ Năng
                    </button>
                )}

                {/* 2. Nút Học Cả Bài (Nếu có Lesson) */}
                {lesson && (
                    <button
                        onClick={() => onStart(lesson, null)} // Gọi start với skill = null -> Học full
                        className={`flex items-center justify-center gap-2 border-2 border-white/30 hover:bg-white/10 active:scale-95 transition-all font-bold py-3 px-5 rounded-xl ${!skill ? 'bg-white text-violet-700 border-transparent hover:bg-violet-50' : 'text-white'}`}
                    >
                        <BookOpen className="w-5 h-5" />
                        {skill ? "Học Lại Bài Này" : "Học Ngay"}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}