import React from 'react'
import { Flame } from 'lucide-react';

export default function Quest() {
  return (
    <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Flame className="text-yellow-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-800 mb-1">Kiếm 30 KN</p>
              <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-yellow-400 rounded-full" style={{ width: '96.67%' }}></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                  29 / 30
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-orange-200 rounded flex items-center justify-center">
              <div className="w-6 h-6 bg-orange-400 rounded"></div>
            </div>
          </div>
  )
}
