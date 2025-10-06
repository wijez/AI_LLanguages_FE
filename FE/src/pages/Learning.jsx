import React, { useState } from 'react';
import SidebarNav from '../components/SidebarNav'; 
import HeaderHero from '../components/HeaderHero';
import LearningPath from '../components/LearningPath';
import RightSidebar from '../components/RightSidebar';
import ChatWidget from '../components/ChatWidget';
import CharacterBlob from '../components/CharacterBlob';


export default function Learning() {
const [progress] = useState(17); // can be wired to real data later


return (
<div className="flex h-screen bg-white">
{/* Left Sidebar */}
<SidebarNav />


{/* Main content */}
<main className="flex-1 overflow-y-auto bg-white">
<div className="max-w-2xl mx-auto py-8 px-6">
<HeaderHero />
<LearningPath />
</div>
<CharacterBlob />
</main>


{/* Right Sidebar */}
<RightSidebar progress={progress} />


{/* Floating Chat */}
<ChatWidget />
</div>
);
}