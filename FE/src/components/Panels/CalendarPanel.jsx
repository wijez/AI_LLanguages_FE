import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { api } from "../../api/api"; 

export default function CalendarPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.CalendarEvents.list();
        setEvents(Array.isArray(res) ? res : res.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="border-2 border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">Calendar</h3>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500">No upcoming events</p>
      ) : (
        <ul className="space-y-2 text-sm text-gray-700">
          {events.map((e) => (
            <li key={e.id} className="px-2 py-1 rounded hover:bg-gray-50">
              <span className="font-semibold">{e.title}</span> -{" "}
              {new Date(e.start_time).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
