import React from 'react';
import { Home, Coffee, Dumbbell, Shield, Crown, Store, User, MoreHorizontal } from 'lucide-react';


export default function SidebarNav() {
const Item = ({ active, icon: Icon, children }) => (
<button
className={[
'w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2',
active
? 'bg-blue-50 text-blue-500 font-bold'
: 'text-gray-600 hover:bg-gray-50',
].join(' ')}
>
<Icon className="w-6 h-6" />
<span>{children}</span>
</button>
);


return (
<aside className="w-64 border-r border-gray-200 flex flex-col">
<div className="p-6">
<div className="text-green-500 font-bold text-3xl">duolingo</div>
</div>
<nav className="flex-1 px-3">
<Item active icon={Home}>HỌC</Item>
<Item icon={Coffee}>PHÁT ÂM</Item>
<Item icon={Dumbbell}>LUYỆN TẬP</Item>
<Item icon={Shield}>BẢNG XẾP HẠNG</Item>
<Item icon={Crown}>NHIỆM VỤ</Item>
<Item icon={Store}>CỬA HÀNG</Item>
<Item icon={User}>HỒ SƠ</Item>
<Item icon={MoreHorizontal}>XEM THÊM</Item>
</nav>
</aside>
);
}