import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'vi', flag: '🇻🇳' },
  { code: 'en', flag: '🇺🇸' },
  { code: 'zh', flag: '🇨🇳' },
  { code: 'ja', flag: '🇯🇵' },
  { code: 'ko', flag: '🇰🇷' }
];

export default function LanguageDropdown() {
  const { i18n, t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const cur = i18n.language.slice(0, 2);

  React.useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const change = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    localStorage.setItem('native_lang', code);
     window.dispatchEvent(new CustomEvent('nativeLangChanged', { detail: code }));
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-extrabold uppercase text-xs"
      >
        {t('lang.display', { name: t(`lang.${cur}`) })}
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg z-50 p-1">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => change(l.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${cur === l.code ? 'bg-gray-50 font-semibold' : ''}`}
            >
              <span className="text-lg">{l.flag}</span>
              <span>{t(`lang.${l.code}`)}</span>
              {cur === l.code && <span className="ml-auto text-emerald-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}