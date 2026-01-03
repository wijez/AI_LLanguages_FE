import React from "react";

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
      "z-40 w-full transition-all duration-300", 
      sticky && "sticky top-0", 
      className
    )}>
      <div className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md overflow-hidden">
        
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>

        <div className={clsx(
          "transition-all duration-300",
          children ? "h-36 sm:h-44" : "h-28 sm:h-36" 
        )} />
        
        {/* 2. Main Content (Title, Icon, Subtitle) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center z-10">
          <div className="flex items-center gap-3 animate-fadeIn">
            {Icon && (
              <Icon className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-md text-white/90" />
            )}
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight drop-shadow-md">
              {title}
            </h1>
          </div>
          
          {subtitle && (
            <p className="mt-2 text-xs sm:text-base text-indigo-50/90 max-w-2xl font-medium drop-shadow-sm line-clamp-2 px-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>

     
      {children && (
        <div className="relative z-50 -mt-8 px-4 pb-2 w-full flex justify-center">
          <div className="w-full max-w-7xl">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}