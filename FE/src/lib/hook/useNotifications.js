import { api } from "../../api/api";
import { useRealtimeList } from "./useRealtimeList";

function wsNotificationsURL() {
    const token = localStorage.getItem("access");
    if (!token) return null;
  
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const host = import.meta.env.VITE_API_HOST;
  
    return `${proto}://${host}/ws/notifications/?token=${token}`;
  }
  

export function useNotifications() {
  const {
    items,
    loading,
    nextPage,
    loadMore,
    setItems,
  } = useRealtimeList({
    fetcher: (url) =>
      url
        ? api.get(url)
        : api.Notifications.list(),

    wsURL: wsNotificationsURL,

    onWSMessage: (msg, scheduleRefetch) => {
      if (
        msg.type === "notification_created" ||
        msg.type === "notification_updated"
      ) {
        scheduleRefetch();
      }
    },

    keyField: "id",
    debounceMs: 200,
  });


  const markAsRead = async (id) => {
    // optimistic update
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    try {
      await api.Notifications.read(id);
    } catch (e) {
      console.error("Mark read error:", e);
    }
  };
  

  const markAllRead = async () => {
    setItems((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    );

    try {
      await api.Notifications.markAllRead?.();
    } catch (e) {
      console.error("Mark all read error:", e);
    }
  };

  return {
    items,
    loading,
    nextPage,
    fetchNotifications: loadMore,
    markAsRead,
    markAllRead,
  };
}
