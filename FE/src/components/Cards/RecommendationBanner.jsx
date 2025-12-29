import React, { useState } from "react";
import { Sparkles, Play, Zap, RefreshCw, BrainCircuit, Info, CheckCircle2, Target } from "lucide-react"; 

export default function RecommendationBanner({ 
  lesson, 
  skill,         // <--- Nhận thêm object Skill
  loading, 
  onStart,       // Callback khi bấm học: (lesson, skill) => ...
  onGenerate, 
  reasoning, 
  recType,
  isGenerating
}) {
  
  const [showDetails, setShowDetails] = useState(false);

  // --- 1. SKELETON LOADING ---
  if (loading || isGenerating) {
    return (
      <div className="mb-6 p-6 rounded-2xl bg-white border border-violet-100 shadow-sm h-44 animate-pulse flex flex-col justify-between relative overflow-hidden">
         {/* Hiệu ứng shimmer chạy qua */}
         <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
         
         <div className="h-4 w-32 bg-slate-200 rounded-full"></div>
         <div className="space-y-2">
            <div className="h-8 w-2/3 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
         </div>
         <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  // --- 2. EMPTY STATE (Chưa có gợi ý) ---
  if (!lesson) {
    return (
        <div className="mb-6 p-8 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 flex flex-col items-center justify-center text-center group hover:bg-violet-50 transition-colors">
            <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6 text-violet-500" />
            </div>
            <h3 className="text-violet-900 font-semibold text-lg mb-1">Trợ lý AI học tập</h3>
            <p className="text-violet-600/80 text-sm mb-4 max-w-md">
                Hệ thống sẽ phân tích lịch sử làm bài để tìm ra nội dung bạn cần cải thiện nhất.
            </p>
            <button 
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200 transition-all font-medium active:scale-95 disabled:opacity-70"
            >
                <Zap className="w-4 h-4 fill-current" />
                {isGenerating ? "Đang phân tích..." : "Phân tích ngay"}
            </button>
        </div>
    );
  }

  // --- 3. SUCCESS STATE ---

  // Cấu hình hiển thị theo loại gợi ý
  const typeConfig = {
      review: { label: "Cần ôn tập", color: "text-orange-200", bg: "bg-orange-500/20", icon: <RefreshCw className="w-3 h-3"/> },
      challenge: { label: "Thử thách", color: "text-yellow-200", bg: "bg-yellow-500/20", icon: <Zap className="w-3 h-3"/> },
      practice: { label: "Luyện tập", color: "text-blue-200", bg: "bg-blue-500/20", icon: <Sparkles className="w-3 h-3"/> },
      word: { label: "Từ vựng", color: "text-green-200", bg: "bg-green-500/20", icon: <BrainCircuit className="w-3 h-3"/> },
  };
  
  const currentType = typeConfig[recType] || typeConfig['practice'];
  const reasonsList = Array.isArray(reasoning) ? reasoning : (reasoning ? [reasoning] : []);

  // Logic hiển thị tiêu đề: Ưu tiên Skill nếu có
  const mainTitle = skill ? skill.title : lesson.title;
  const subTitle = skill ? `Trong bài: ${lesson.title}` : "";
  const buttonText = skill ? "Luyện Skill" : "Học ngay";

  return (
    <div className="mb-6 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-xl shadow-violet-200 transition-all hover:shadow-violet-300">
      
      {/* Background Shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-400 opacity-10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
      
      <div className="p-6 md:p-8 relative z-10">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 text-xs font-bold tracking-wide uppercase backdrop-blur-md ${currentType.bg} ${currentType.color}`}>
                {currentType.icon}
                <span>{currentType.label}</span>
            </div>
            
            <div className="flex gap-1">
                {/* Nút Info: Toggle chi tiết */}
                {reasonsList.length > 0 && (
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className={`p-2 rounded-full transition-all ${showDetails ? 'bg-white text-violet-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        title="Tại sao gợi ý này?"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                )}
                {/* Nút Refresh */}
                <button 
                    onClick={onGenerate}
                    disabled={isGenerating}
                    title="Tạo lại gợi ý mới"
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all active:scale-90"
                >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
        
        {/* Content Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
                {/* Tiêu đề chính */}
                <h3 className="text-2xl md:text-3xl font-bold mb-1 leading-tight tracking-tight flex items-center gap-2">
                    {skill && <Target className="w-6 h-6 text-fuchsia-300 shrink-0" />} 
                    {mainTitle}
                </h3>

                {/* Tiêu đề phụ (nếu luyện skill) */}
                {subTitle && (
                    <p className="text-violet-200 text-sm font-medium mb-2 pl-0.5">
                        {subTitle}
                    </p>
                )}
                
                {/* Lý do ngắn gọn (khi đóng chi tiết) */}
                {!showDetails && (
                    <div className="flex items-center gap-2 text-violet-100/90 text-sm font-medium mt-2 animate-fadeIn">
                       <BrainCircuit className="w-4 h-4 shrink-0" />
                       <p className="line-clamp-1">{reasonsList[0] || "Dựa trên tiến độ học tập của bạn"}</p>
                       {reasonsList.length > 1 && <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-md">+{reasonsList.length - 1}</span>}
                    </div>
                )}

                {/* Chi tiết lý do (khi mở) */}
                {showDetails && (
                    <div className="mt-3 bg-black/20 rounded-xl p-3 text-sm animate-fadeIn backdrop-blur-sm border border-white/10">
                        <p className="font-semibold text-white mb-2 text-xs uppercase tracking-wider opacity-70">
                            Phân tích từ AI:
                        </p>
                        <ul className="space-y-1.5">
                            {reasonsList.map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-violet-50">
                                    <CheckCircle2 className="w-4 h-4 text-green-300 shrink-0 mt-0.5" />
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Nút hành động chính */}
            <button
                // QUAN TRỌNG: Truyền cả lesson và skill lên cha
                onClick={() => onStart(lesson, skill)}
                className="shrink-0 flex items-center justify-center gap-2 bg-white text-violet-700 hover:bg-violet-50 hover:text-violet-800 active:scale-95 transition-all font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl w-full md:w-auto min-w-[150px]"
            >
                <Play className="w-5 h-5 fill-current" />
                {buttonText}
            </button>
        </div>
      </div>
    </div>
  );
}