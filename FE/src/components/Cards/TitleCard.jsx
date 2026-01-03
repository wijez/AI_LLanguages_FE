import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/api';

export default function TitleCard({
  topic,               
  topicId,
  slug,
  sectionPrefix,
  section = '',
  title = '',
  onBack,
  onHelp,
  helpText, 
  floating = false,
  offset = 'top-2 md:top-3',
  center = true,
  cta,
  className
}) {
  const { t } = useTranslation(['learn', 'common']);
  const [data, setData] = React.useState(topic || null);
  const [loading, setLoading] = React.useState(!!(!topic && (topicId || slug)));
  const [error, setError] = React.useState('');

  // Lấy text hiển thị: Priority: Prop truyền vào -> i18n -> Default
  const displayHelpText = helpText || t('learn:guide', { defaultValue: 'HƯỚNG DẪN' }); 

  React.useEffect(() => {
    if (topic) {
      setData(topic);
      setLoading(false);
      setError('');
    }
  }, [topic]);

  React.useEffect(() => {
    if (topic || (!topicId && !slug)) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        let tData = null;
        if (topicId) {
          tData = await api.Topics.get(topicId);
        } else if (slug) {
          const res = await api.Topics.list({ slug });
          const items = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
          tData = items[0] || null;
        }
        if (!cancelled) setData(tData);
      } catch (e) {
        if (!cancelled) setError(e?.message || t('learn:error_topic', { defaultValue: 'Lỗi tải chủ đề' })); 
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [topic, topicId, slug, t]);

  const computedTitle = data?.title ?? title;
  
  // Xử lý hiển thị Section (Ví dụ: "CHỦ ĐỀ, CỬA 1")
  const computedSection = data
    ? (sectionPrefix 
        ? `${sectionPrefix}, ${t('learn:door', { defaultValue: 'CỬA' })} ${data?.order ?? '?'}` 
        : `${t('learn:door', { defaultValue: 'CỬA' })} ${data?.order ?? '?'}`)
    : section;

  return (
    <div className={clsx(floating && 'sticky z-50', floating && offset, center && 'mx-auto', 'w-full max-w-[1100px]')}>
      <div className={clsx(
        'w-full rounded-3xl',
        'bg-[linear-gradient(135deg,#1cb0f6_0%,#0ea5e9_100%)]',
        'text-white p-4 md:p-6',
        'shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.08)]',
        className
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-white/90 hover:text-white focus:outline-none">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M14 6L8 12L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs md:text-sm font-extrabold tracking-wide uppercase">
                {loading && !computedSection ? '...' : (computedSection || '—')}
              </span>
            </button>

            <h1 className="mt-2 text-xl md:text-2xl lg:text-2xl font-extrabold leading-snug">
              {loading && !computedTitle ? t('common:loading', { defaultValue: 'Đang tải...' }) : (computedTitle || '—')}
            </h1>

            {error && <div className="mt-1 text-xs font-medium text-rose-100/90">{t('learn:error_topic', { defaultValue: 'Lỗi tải chủ đề' })}: {error}</div>}
          </div>

          <button
            type="button"
            onClick={onHelp}
            className="relative inline-flex items-center gap-2 rounded-2xl px-4 py-2 md:px-5 md:py-2.5
                       bg-sky-400/25 ring-2 ring-sky-700/50 shadow-[0_3px_0_0_rgba(0,0,0,0.12)]
                       hover:bg-sky-400/35 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-white/70"
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
            <span className="font-extrabold tracking-wide">{displayHelpText}</span>
            <span className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-sky-800/30" />
          </button>
        </div>
      </div>

      {cta && <div className="mt-2 flex justify-center">{cta}</div>}
    </div>
  );
}