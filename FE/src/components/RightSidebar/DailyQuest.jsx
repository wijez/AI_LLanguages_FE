import React from 'react';
import { Gift } from 'lucide-react';


export default function DailyQuest({ progress = 17 }) {
return (
<div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
<div className="flex items-center justify-between mb-4">
<h3 className="font-bold text-gray-800">Nhiệm vụ hàng ngày</h3>
<button className="text-blue-500 font-bold text-sm">XEM TẤT CẢ</button>
</div>


<div className="flex items-center gap-4 mb-4">
<div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
<Gift className="w-8 h-8 text-yellow-600" />
</div>
<div className="flex-1">
<div className="font-bold text-gray-800 mb-2">Kiếm 30 KN</div>
<div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
<div
className="bg-yellow-400 h-full rounded-full transition-all duration-300"
style={{ width: `${progress}%` }}
></div>
</div>
<div className="text-xs text-gray-600 mt-1">{progress} / 30</div>
</div>
<div className="w-10 h-10 bg-orange-100 rounded flex items-center justify-center">
<div className="text-xl">🎁</div>
</div>
</div>


<div className="flex items-center gap-4 pt-4 border-t border-gray-200">
<div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
<div className="text-2xl">📚</div>
</div>
<div className="flex-1">
<div className="font-bold text-gray-800">Học trong 10 phút</div>
</div>
</div>
</div>
);
}