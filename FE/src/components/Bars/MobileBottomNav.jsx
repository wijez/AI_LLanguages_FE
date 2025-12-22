import React from 'react'
import { Home, Volume2, Dumbbell, Shield, User, Briefcase} from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'

export default function MobileBottomNav() {
  const location = useLocation()
  
  const navItems = [
    { icon: Home, label: 'HỌC', path: '/learn' },
    { icon: Volume2, label: 'PHÁT ÂM', path: '/speech' },
    { icon: Dumbbell, label: 'LUYỆN TẬP', path: '/practice' },
    { icon: Shield, label: 'BẢNG', path: '/rank' },
    {icon: Briefcase, label: 'NHIỆM VỤ', path: '/task'},
    { icon: User, label: 'HỒ SƠ', path: '/profile' },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-bold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}