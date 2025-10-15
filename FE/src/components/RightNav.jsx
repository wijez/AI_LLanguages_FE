import React from 'react'
import DailyQuestCard from './Cards/DailyQuestCard'
import TournamentCard from './Cards/TournamentCard'
import StatsBar from './Bars/StatsBar'
import Links from './Footers/Links'

export default function RightNav() {
  return (
    <div className="w-full h-screen overflow-y-auto bg-white border-l border-gray-200 p-4 lg:p-6 space-y-4 lg:space-y-6 sticky top-0">
      <StatsBar />
      <TournamentCard />
      <DailyQuestCard />
      <Links />
    </div>
  )
}