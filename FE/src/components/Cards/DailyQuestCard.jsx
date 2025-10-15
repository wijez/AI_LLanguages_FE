import React from 'react'
import Quest from '../Cards/Quest'

export default function DailyQuestCard() {
  return (
      <div className="border-2 border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Nhiệm vụ hàng ngày</h3>
          <button className="text-blue-500 text-sm font-bold hover:underline">
            XEM TẤT CẢ
          </button>
        </div>
        <Quest />
        <Quest />
        <Quest />
      </div>
  )
}
