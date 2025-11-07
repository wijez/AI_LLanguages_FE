import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageDropdown from '../../components/Dropdowns/LanguageDropdown';
import LangFlag from '../../components/LangFlag.jsx';
import Elephant from '../../assets/elephant.svg?url';
import { api } from '../../api/api';

export default function SignupPage({ onSelect }) {
  const { t, i18n } = useTranslation(['signup', 'common']);
  const navigate = useNavigate();

  const ui = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const native = (localStorage.getItem('native_lang') || ui).split('-')[0];

  const l10n = t('signup:l10n', { returnObjects: true }) || {};
  const allCodes = Object.keys(l10n);
  const options = allCodes.filter((code) => code !== native);

  const nf = new Intl.NumberFormat(i18n.resolvedLanguage || i18n.language);
  const isVi = ui === 'vi';
  const learnersLabel = t('signup:learners');
  const fmtLearners = (n) => {
    if (n == null) return null;
    if (n >= 1e6) return `${nf.format(n / 1e6)} ${isVi ? 'Tr' : 'M'} ${learnersLabel}`;
    if (n >= 1e3) return `${nf.format(Math.round(n / 1e3))} ${isVi ? 'N' : 'K'} ${learnersLabel}`;
    return `${nf.format(n)} ${learnersLabel}`;
  };

  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  const handleSelect = async (code) => {
    // ✅ đồng bộ với api.js: token key = 'access'
    const access = typeof window !== 'undefined' ? localStorage.getItem('access') : null;

    // lưu ngôn ngữ để dùng lại sau login
    localStorage.setItem('learn', code);

    if (onSelect) return onSelect(code);

    // Chưa đăng nhập → qua login, kèm learn
    if (!access) {
      return navigate(`/login?learn=${code}`);
    }

    try {
      setBusy(true);
      setErr('');

      // tạo enrollment theo language_code
      let created = await api.Enrollments.create({ language_code: code });
      let enrollId = created?.id;

      // fallback: nếu BE yêu cầu id FK
      if (!enrollId) {
        const langs = await api.Languages.list({ code });
        const lang =
          (Array.isArray(langs) ? langs.find((l) => l.code === code) : null) ||
          langs?.results?.find((l) => l.code === code) ||
          (Array.isArray(langs) ? langs[0] : langs?.results?.[0]);

        if (lang?.id) {
          created = await api.Enrollments.create({ language: lang.id });
          enrollId = created?.id;
        }
      }

      if (enrollId) {
        return navigate(`/signup/goal?enroll=${enrollId}&learn=${code}`);
      }

      // fallback cuối
      return navigate(`/signup/goal?learn=${code}`);
    } catch (e) {
      // Nếu đã tồn tại → lấy enrollment cũ
      try {
        const list = await api.Enrollments.list({ language_code: code, mine: 1 });
        const item = Array.isArray(list) ? list[0] : list?.results?.[0];
        if (item?.id) {
          return navigate(`/signup/goal?enroll=${item.id}&learn=${code}`);
        }
      } catch {}
      setErr(e?.response?.data?.detail || 'Could not create enrollment');
      return navigate(`/signup/goal?learn=${code}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-3">
          <img src={Elephant} alt="Elephant" className="w-24 h-24" />
          <LanguageDropdown />
        </div>
      </header>

      {/* Title */}
      <div className="max-w-screen-lg mx-auto px-3 sm:px-4 mt-6 sm:mt-10 mb-2 sm:mb-3 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-700">
          {t('signup:title')}
        </h1>
        {busy && (
          <div className="mt-2 text-sm text-slate-500">
            {isVi ? 'Đang đăng ký...' : 'Creating enrollment...'}
          </div>
        )}
        {err && <div className="mt-2 text-sm text-rose-600">{err}</div>}
      </div>

      {/* Cards */}
      <main className="flex-1">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 pb-16">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
            {options.map((code) => {
              const label = l10n[code];
              const learnersStr = null; // thay = fmtLearners(n) nếu có số người học

              return (
                <button
                  key={code}
                  onClick={() => void handleSelect(code)}
                  disabled={busy}
                  className="
                    group relative
                    w-[min(100%,210px)] sm:w-[240px] md:w-[260px] lg:w-[280px]
                    rounded-2xl sm:rounded-3xl border border-slate-200 bg-white
                    p-4 sm:p-6 text-center
                    shadow-[0_2px_0_rgba(0,0,0,.05)] hover:shadow-[0_6px_0_rgba(0,0,0,.06)]
                    hover:border-slate-300 transition-transform hover:-translate-y-[2px]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58cc02]/60
                    disabled:opacity-50 disabled:cursor-not-allowed
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
