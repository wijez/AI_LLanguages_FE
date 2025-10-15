import React from 'react'
import { LeftNav, RightNav, MobileBottomNav } from '../lazy'

export default function MainLayout({ children, showRightNav = true,  containerClassName }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Navigation - Desktop only */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0">
        <LeftNav />
      </div>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 scrollbar-hide">
        {/* <div className="max-w-5xl mx-auto px-4 py-6 flex justify-center"> */}
         <div className={containerClassName ?? "max-w-5xl mx-auto px-4 py-6 flex justify-center"}>
          {children}
        </div>
      </main>

      {/* Right Navigation - Desktop only (xl and above) */}
      {showRightNav && (
        <div className="hidden xl:block xl:w-80 2xl:w-96 flex-shrink-0">
          <RightNav />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}