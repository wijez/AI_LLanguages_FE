import React from 'react';
import clsx from 'clsx';

/**
 * TitleCard (floating)
 * props:
 *  - section, title, onBack, onHelp, helpText
 *  - floating    : boolean  => bật sticky trong scroll container (main)
 *  - offset      : string   => lớp Tailwind vị trí sticky (vd: "top-2 md:top-3")
 *  - center      : boolean  => căn giữa theo vùng Main
 *  - cta         : ReactNode => phần CTA render bên dưới card (giữa)
 *  - className   : string   => thêm class ngoài
 */
export default function TitleCard({
  section = '',
  title = '',
  onBack,
  onHelp,
  helpText = 'HƯỚNG DẪN',
  floating = false,
  offset = 'top-2 md:top-3',
  center = true,
  cta,
  className
}) {
  return (
    <div
      className={clsx(
        // wrapper để sticky + căn giữa
        floating && 'sticky z-50',
        floating && offset,
        center && 'mx-auto',
        'w-full max-w-[1100px]'
      )}
    >
      <div
        className={clsx(
          'w-full rounded-3xl',
          'bg-[linear-gradient(135deg,#1cb0f6_0%,#0ea5e9_100%)]',
          'text-white p-4 md:p-6',
          'shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.08)]',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: back + section + title */}
          <div className="min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white focus:outline-none"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M14 6L8 12L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs md:text-sm font-extrabold tracking-wide uppercase">
                {section}
              </span>
            </button>

            {/* fix kích thước title: lớn dần theo breakpoints */}
            <h1 className="mt-2 text-xl md:text-2xl lg:text-2xl font-extrabold leading-snug">
              {title}
            </h1>
          </div>

          {/* Right: help button */}
          <button
            type="button"
            onClick={onHelp}
            className={clsx(
              'relative inline-flex items-center gap-2',
              'rounded-2xl px-4 py-2 md:px-5 md:py-2.5',
              'bg-sky-400/25 ring-2 ring-sky-700/50',
              'shadow-[0_3px_0_0_rgba(0,0,0,0.12)]',
              'hover:bg-sky-400/35 active:translate-y-[1px]',
              'focus:outline-none focus:ring-2 focus:ring-white/70'
            )}
          >
            <span className="grid place-items-center rounded-md bg-white/90 text-sky-600 p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="6" width="10" height="2" rx="1" fill="currentColor" />
                <rect x="5" y="11" width="10" height="2" rx="1" fill="currentColor" />
                <rect x="5" y="16" width="6" height="2" rx="1" fill="currentColor" />
                <circle cx="18" cy="7" r="2" fill="currentColor" />
                <circle cx="18" cy="12" r="2" fill="currentColor" />
                <circle cx="18" cy="17" r="2" fill="currentColor" />
              </svg>
            </span>
            <span className="font-extrabold tracking-wide">{helpText}</span>
            <span className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-sky-800/30" />
          </button>
        </div>
      </div>

      {/* CTA ở giữa, nằm dưới card (tuỳ chọn) */}
      {cta && (
        <div className="mt-2 flex justify-center">
          {cta}
        </div>
      )}
    </div>
  );
}
