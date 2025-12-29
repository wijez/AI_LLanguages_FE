
import React from "react";

export default function Header({ 
  title, 
  icon: Icon, 
  subtitle, 
  children, 
  className,
  sticky = true 
}) {
  return (
    <div className={clsx(
      "z-40 w-full", 
      sticky && "sticky top-0", 
      className
    )}>
      {/* Gradient Background */}
      <div className="relative bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 shadow-md">
        {/* Height container */}
        <div className="h-32 sm:h-36" />
        
        {/* Title & Icon Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md" />}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-md">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-white/90 max-w-2xl font-medium drop-shadow-sm line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Floating Content (Tabs, Controls, Summary Cards) */}
      {children && (
        <div className="relative z-50 -mt-6 px-4 pb-2">
          {children}
        </div>
      )}
    </div>
  );
}// src/components/Header.jsx
import React from "react";

// Hàm utility đơn giản để gộp class (bạn có thể import từ utils của bạn nếu có)
const clsx = (...xs) => xs.filter(Boolean).join(" ");

export default function Header({ 
  title, 
  icon: Icon, 
  subtitle, 
  children, 
  className,
  sticky = true 
}) {
  return (
    <div className={clsx(
      "z-40 w-full", 
      sticky && "sticky top-0", 
      className
    )}>
      {/* Gradient Background */}
      <div className="relative bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 shadow-md">
        {/* Height container */}
        <div className="h-32 sm:h-36" />
        
        {/* Title & Icon Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md" />}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-md">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-white/90 max-w-2xl font-medium drop-shadow-sm line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Floating Content (Tabs, Controls, Summary Cards) */}
      {children && (
        <div className="relative z-50 -mt-6 px-4 pb-2">
          {children}
        </div>
      )}
    </div>
  );
}