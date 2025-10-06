import React from 'react';


export default function SuperPromo() {
return (
<div className="bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
<div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-300 to-blue-400 rounded-full -mr-8 -mt-8 opacity-50"></div>
<div className="relative">
<div className="bg-green-400 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">SUPER</div>
<h3 className="text-white text-xl font-bold mb-2">Thử Super miễn phí</h3>
<p className="text-white text-sm mb-4">
Không quảng cáo, học phù hợp với trình độ và không giới hạn số lần chinh phục Huyền thoại!
</p>
<button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
THỬ 1 TUẦN MIỄN PHÍ
</button>
</div>
</div>
);
}