import React from 'react'
import { Flag, Flame, Gem, Trophy } from 'lucide-react';

export default function StatsBar() {
  return (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="text-red-500" size={20} />
          <span className="font-bold text-gray-700">20</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="text-orange-500" size={20} />
          <span className="font-bold text-gray-700">51</span>
        </div>
        <div className="flex items-center gap-2">
          <Gem className="text-blue-500" size={20} />
          <span className="font-bold text-gray-700">590</span>
        </div>
        <div>
          <Trophy className="text-purple-500" size={24} />
        </div>
      </div>
  )
}
