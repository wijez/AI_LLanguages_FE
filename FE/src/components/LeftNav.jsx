import React from 'react'
import { 
    Home, Volume2, Dumbbell, 
    Shield, Briefcase, Store, 
    User, MoreHorizontal 
} from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import Elephant from '../assets/elephant.svg?url';

export default function LeftNav() {
  const location = useLocation()
  
  const menuItems = [
    { icon: Home, label: 'HỌC', path: '/learn', badge: false },
    { icon: Volume2, label: 'PHÁT ÂM', path: '/speech', badge: false },
    { icon: Dumbbell, label: 'LUYỆN TẬP', path: '/practice', badge: true },
    { icon: Shield, label: 'BẢNG XẾP HẠNG', path: '/rank', badge: false },
    { icon: Briefcase, label: 'NHIỆM VỤ', path: '/task', badge: true },
    { icon: Store, label: 'CỬA HÀNG', path: '/shop', badge: false },
    { icon: User, label: 'HỒ SƠ', path: '/profile', badge: false },
    { icon: MoreHorizontal, label: 'XEM THÊM', path: '/more', badge: false }
  ]

  return (
    <div className="w-full bg-white border-r border-gray-200 p-4 h-screen overflow-y-auto sticky top-0">
      <div className="mb-8">
        <Link to="/learn">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-green-500 cursor-pointer hover:text-green-600 transition-colors">
              <img src={Elephant} alt="Elephant" className="w-24 h-24" /> Aivory
          </h1>
        </Link>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          return (
            <div key={index} className="relative">
              <Link
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className={`${isActive ? 'text-blue-500' : 'text-gray-600'}`}>
                  <Icon size={24} />
                </div>
                <span className={`font-bold text-sm ${
                  isActive ? 'text-blue-500' : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
              </Link>
              {item.badge && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full pointer-events-none"></div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}