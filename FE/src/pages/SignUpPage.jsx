import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageDropdown from '../components/Dropdowns/LanguageDropdown';
import LangFlag from '../components/LangFlag.jsx';
import Elephant from '../assets/elephant.svg?url';


export default function SignupPage({ onSelect }) {
  const { t, i18n } = useTranslation(['signup', 'common']);
  const navigate = useNavigate();

  const ui = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const native = (localStorage.getItem('native_lang') || ui).split('-')[0];

  const l10n = t('signup:l10n', { returnObjects: true }) || {};
  const allCodes = Object.keys(l10n);
  const options = allCodes.filter(code => code !== native);

  const nf = new Intl.NumberFormat(i18n.resolvedLanguage || i18n.language);
  const isVi = ui === 'vi';
  const learnersLabel = t('signup:learners');
  const fmtLearners = (n) => {
    if (n == null) return null;
    if (n >= 1e6) return `${nf.format(n/1e6)} ${isVi ? 'Tr' : 'M'} ${learnersLabel}`;
    if (n >= 1e3) return `${nf.format(Math.round(n/1e3))} ${isVi ? 'N' : 'K'} ${learnersLabel}`;
    return `${nf.format(n)} ${learnersLabel}`;
  };

  const handleSelect = (code) => {
    onSelect?.(code);
    if (!onSelect) navigate(`/signup/goal?learn=${code}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-3">
            <img src={Elephant} alt="Elephant" className="w-24 h-24" />;
          <LanguageDropdown />
        </div>
      </header>

      {/* Title */}
      <div className="max-w-screen-lg mx-auto px-3 sm:px-4 mt-6 sm:mt-10 mb-4 sm:mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-700">
          {t('signup:title')}
        </h1>
      </div>

      {/* Cards: flex-wrap + justify-center -> hàng cuối luôn ở giữa */}
      <main className="flex-1">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 pb-16">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
            {options.map((code) => {
              const label = l10n[code];
              const learnersStr = null; // thay = fmtLearners(n) nếu có số người học

              return (
                <button
                  key={code}
                  onClick={() => handleSelect(code)}
                  className="
                    group relative
                    w-[min(100%,210px)] sm:w-[240px] md:w-[260px] lg:w-[280px]
                    rounded-2xl sm:rounded-3xl border border-slate-200 bg-white
                    p-4 sm:p-6 text-center
                    shadow-[0_2px_0_rgba(0,0,0,.05)] hover:shadow-[0_6px_0_rgba(0,0,0,.06)]
                    hover:border-slate-300 transition-transform hover:-translate-y-[2px]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58cc02]/60
                  "
                >
                  <div className="mx-auto grid place-items-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-slate-50 shadow-inner">
                    <LangFlag code={code} size={52} />
                  </div>

                  <div className="mt-3 sm:mt-4 font-extrabold text-gray-700 text-sm sm:text-base md:text-lg">
                    {label}
                  </div>

                  {learnersStr && (
                    <div className="mt-1 text-slate-500 text-xs sm:text-sm">{learnersStr}</div>
                  )}

                  <span className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl ring-0 ring-[#58cc02]/0 group-hover:ring-2 group-hover:ring-[#58cc02]/60 transition" />
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
