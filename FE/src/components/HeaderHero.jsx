import React from 'react';
import { ChevronLeft, List } from 'lucide-react';


export default function HeaderHero() {
return (
<div className="bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl p-6 mb-8 shadow-lg">
<div className="flex items-center gap-3 mb-4">
<button className="text-white">
<ChevronLeft className="w-6 h-6" />
</button>
<div className="text-white text-sm font-semibold">PHẦN 3, CỬA 1</div>
</div>
<div className="flex items-center justify-between">
<h1 className="text-white text-2xl font-bold">Nói chuyện giữ gìn sức khỏe và vóc dáng</h1>
<button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
<List className="w-5 h-5" />
HƯỚNG DẪN
</button>
</div>
</div>
);
}