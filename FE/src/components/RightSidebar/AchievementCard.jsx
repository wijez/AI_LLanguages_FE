import React from 'react';
import { Shield } from 'lucide-react';


export default function AchievementCard() {
return (
<div className="bg-white border-2 border-gray-200 rounded-2xl p-5 mb-6">
<div className="flex items-center justify-between mb-4">
<h3 className="font-bold text-gray-800">Giải đấu Lam Ngọc</h3>
<button className="text-blue-500 font-bold text-sm">XEM GIẢI ĐẤU</button>
</div>
<div className="flex items-center gap-4">
<div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
<Shield className="w-10 h-10 text-white" />
</div>
<div className="flex-1">
<div className="font-bold text-gray-800 mb-1">Bạn đã đạt vị trí thứ 11</div>
<div className="text-sm text-gray-600">Cách nhóm xuống hạng 5 bậc!</div>
</div>
</div>
</div>
);
}