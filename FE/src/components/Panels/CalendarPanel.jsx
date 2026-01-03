import React, { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { useTranslation } from "react-i18next"; 
import { api } from "../../api/api";

export default function CalendarPanel() {
  const { t, i18n } = useTranslation("common"); 
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentLang = i18n.language || "en"; 

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.CalendarEvents.list();
        const list = Array.isArray(res) ? res : res.results || [];
        
        const sorted = list.sort((a, b) => new Date(a.start) - new Date(b.start));
        setEvents(sorted);
      } catch (err) {
        console.error("Lỗi tải sự kiện:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="border border-gray-200 bg-white rounded-2xl p-4 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4 text-gray-800">
        <Calendar size={20} className="text-blue-600" />
        <h3 className="font-bold text-lg">{t('calendar.title')}</h3>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-12 bg-gray-100 rounded-lg"></div>
          <div className="h-12 bg-gray-100 rounded-lg"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          {t('calendar.empty')}
        </div>
      ) : (
        <ul className="space-y-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
          {events.map((e) => {
            const startDate = new Date(e.start);
            return (
              <li 
                key={e.id} 
                className="group p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800 text-sm line-clamp-2">
                    {e.title}
                  </span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded ml-2 shrink-0">
                    {startDate.toLocaleDateString(currentLang, { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                
                {e.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {e.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>
                      {startDate.toLocaleTimeString(currentLang, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {e.kind && (
                    <span className="uppercase tracking-wider text-[10px] border border-gray-200 px-1 rounded">
                      {e.kind}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}