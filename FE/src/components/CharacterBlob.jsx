import React from 'react';


export default function CharacterBlob() {
return (
<div className="fixed bottom-32 left-1/2 transform -translate-x-16">
<div className="relative">
<div className="w-32 h-32 bg-orange-600 rounded-full"></div>
<div className="absolute top-4 left-8 w-16 h-20 bg-amber-700 rounded-full"></div>
<div className="absolute top-12 left-10 w-12 h-12 bg-orange-400 rounded-lg"></div>
<div className="absolute bottom-8 right-4 w-8 h-12 bg-orange-500 rounded-full"></div>
</div>
</div>
);
}