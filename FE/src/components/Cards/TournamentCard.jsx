import React from 'react'
import { Shield } from 'lucide-react'

export default function TournamentCard() {
  return (
    <div className="border-2 border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Giải đấu Lam Ngọc</h3>
          <button className="text-blue-500 text-sm font-bold hover:underline">
            XEM GIẢI ĐẤU
          </button>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1">
              Bạn đã đạt <span className="text-blue-500">vị trí thứ 1</span>
            </p>
            <p className="text-sm text-gray-600">
              Tiếp tục phấn đấu để giữ vị trí trong top 3!
            </p>
          </div>
        </div>
      </div>
  )
}
