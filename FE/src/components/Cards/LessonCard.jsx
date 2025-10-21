import React from 'react';
import { BookOpen, Repeat, AlertCircle } from 'lucide-react';
import { api } from '../../api/api';

const DEBUG =
  (import.meta.env && import.meta.env.DEV) ||
  (typeof window !== 'undefined' && localStorage.getItem('debug_api') === '1');

export default function LessonCard({
  topicId,
  className = '',
  onOpenLesson, // (lesson) => void
}) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [lessons, setLessons] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setErr('');
      if (!topicId) {
        setLessons([]);
        return;
      }
      try {
        setLoading(true);
        const params = { topic_id: topicId, page_size: 200 };
        DEBUG && console.groupCollapsed('%c[LessonCard] GET /lessons/', 'color:#0ea5e9;font-weight:700');
        DEBUG && console.log('Params:', params);

        // 1) Thử list theo /lessons/?topic_id=<id>
        let res = await api.Lessons.list(params, { signal: controller.signal });
        let items = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);

        // 2) Fallback: nếu rỗng, thử /topics/{id}/lessons/ (nếu bạn có action này)
        if ((!items || items.length === 0) && topicId) {
          try {
            DEBUG && console.log('Empty from /lessons/ → fallback /topics/{id}/lessons/');
            const alt = await api.get(`/topics/${topicId}/lessons/`, { signal: controller.signal });
            items = Array.isArray(alt?.results) ? alt.results : (Array.isArray(alt) ? alt : []);
          } catch {}
        }

        // sort ổn định
        items = [...(items || [])].sort((a, b) => (a.order - b.order) || (a.id - b.id));

        if (!cancelled) setLessons(items);

        DEBUG && console.table(items.map(({ id, order, title, content }) => ({
          id, order, title, type: content?.type
        })));
        DEBUG && console.groupEnd();
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Failed to load lessons');
        if (DEBUG) {
          console.group('%c[LessonCard ERROR]', 'color:#ef4444;font-weight:700');
          console.error(e);
          const r = e?.response;
          if (r) {
            console.log('Status:', r.status);
            console.log('Data  :', r.data);
          }
          console.groupEnd();
        }
      } finally {
        !cancelled && setLoading(false);
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, [topicId]);

  return (
    <div className={`mt-4 rounded-2xl border border-gray-200 bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">Lessons</h3>
        <div className="text-xs text-gray-500">{lessons?.length || 0}</div>
      </div>

      {!topicId && (
        <div className="text-sm text-gray-500">Chọn một chủ đề để xem bài học.</div>
      )}

      {topicId && loading && (
        <div className="text-sm text-gray-500">Đang tải bài học…</div>
      )}

      {topicId && !loading && err && (
        <div className="flex items-center gap-2 text-sm text-rose-600">
          <AlertCircle size={16} />
          <span>{err}</span>
        </div>
      )}

      {topicId && !loading && !err && lessons?.length === 0 && (
        <div className="text-sm text-gray-500">Chưa có bài học cho chủ đề này.</div>
      )}

      {topicId && !loading && !err && lessons?.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {lessons.map((ls) => {
            const isReview = (ls?.content?.type || '').toLowerCase() === 'review';
            const icon = isReview ? <Repeat size={18} /> : <BookOpen size={18} />;
            return (
              <button
                key={ls.id}
                onClick={() => onOpenLesson?.(ls)}
                className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-left hover:border-sky-300 hover:bg-sky-50"
                title={ls.title}
              >
                <div className="flex items-center gap-2">
                  <div className={`grid h-9 w-9 place-items-center rounded-full ${isReview ? 'bg-amber-100 text-amber-600' : 'bg-sky-100 text-sky-600'}`}>
                    {icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700 leading-5">
                      {ls.title || (isReview ? 'Ôn tập' : `Bài ${ls.order}`)}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {isReview ? 'Review' : `Lesson ${ls.order}`} · {ls.xp_reward ?? 10} XP · {Math.round((ls.duration_seconds ?? 120)/60)}’
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-400 group-hover:text-sky-500">▶</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
