import React from 'react';
import StatsBar from './StatsBar';
import SuperPromo from './SuperPromo';
import AchievementCard from './AchievementCard';
import DailyQuest from './DailyQuest';


export default function RightSidebar({ progress }) {
return (
<aside className="w-96 border-l border-gray-200 p-6 overflow-y-auto">
<StatsBar />
<SuperPromo />
<AchievementCard />
<DailyQuest progress={progress} />
</aside>
);
}