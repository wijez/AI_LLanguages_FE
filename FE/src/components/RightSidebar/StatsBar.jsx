import React from 'react';


export default function StatsBar() {
return (
<div className="flex items-center justify-between mb-6">
<div className="flex items-center gap-2">
<img
src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%233c3b6e' width='64' height='64'/%3E%3Cpath fill='%23fff' d='M0 0h64v5H0zm0 10h64v5H0zm0 10h64v5H0zm0 10h64v5H0zm0 10h64v5H0zm0 10h64v5H0z'/%3E%3Crect fill='%23b22234' width='26' height='32'/%3E%3C/svg%3E"
className="w-8 h-6 rounded"
alt="US Flag"
/>
<span className="font-bold text-gray-700">20</span>
</div>
<div className="flex items-center gap-2">
<div className="text-orange-500 text-xl">🔥</div>
<span className="font-bold text-gray-700">42</span>
</div>
<div className="flex items-center gap-2">
<div className="text-blue-500 text-xl">💎</div>
<span className="font-bold text-gray-700">1317</span>
</div>
<div className="flex items-center gap-2">
<div className="text-red-500 text-xl">❤️</div>
<span className="font-bold text-gray-700">4</span>
</div>
</div>
);
}