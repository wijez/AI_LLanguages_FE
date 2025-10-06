import React from 'react';
import { Star, Book, Users, Lock } from 'lucide-react';


export default function LearningPath() {
return (
<div className="flex flex-col items-center gap-6">
{/* Start Button */}
<div className="flex flex-col items-center">
<div className="text-blue-500 font-bold mb-2 text-sm">BẮT ĐẦU</div>
<div className="w-24 h-24 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform cursor-pointer">
<Star className="w-12 h-12 text-white fill-white" />
</div>
</div>


{/* Book Icon */}
<div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
<Book className="w-10 h-10 text-gray-400" />
</div>


{/* Star Icon (locked) */}
<div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
<Star className="w-10 h-10 text-gray-400" />
</div>


{/* Users Icon (locked) */}
<div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
<Users className="w-10 h-10 text-gray-400" />
</div>


{/* Treasure Chest */}
<div className="w-24 h-24 bg-gray-300 rounded-lg flex items-center justify-center relative shadow-md">
<div className="absolute top-0 w-full h-8 bg-gray-400 rounded-t-lg"></div>
<Lock className="w-10 h-10 text-gray-500 mt-4" />
</div>


{/* Bottom Star (locked) */}
<div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
<Star className="w-10 h-10 text-gray-400" />
</div>
</div>
);
}