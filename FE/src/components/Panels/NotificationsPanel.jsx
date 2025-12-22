import { Bell } from "lucide-react";
import { useState } from "react";
import Spinner from "../Spinner";
import Modal from "../UI/Modal";
import { useNotifications } from "../../lib/hook/useNotifications";

export default function NotificationsPanel() {
  const {
    items,
    loading,
    nextPage,
    fetchNotifications,
    markAsRead,
  } = useNotifications();

  const [selected, setSelected] = useState(null);
  const hasUnread = items.some((n) => !n.read_at);

  const openNotification = async (item) => {
    setSelected(item);
  
    if (!item.read_at) {
      await markAsRead(item.id);
    }
  };

  return (
    <div className="border-2 rounded-2xl p-4">
      <h3 className="font-bold flex items-center gap-2">
      <div className="relative">
          <Bell size={18} />
          
          {hasUnread && (
            <span
              className="
                absolute -top-1 -right-0.5
                h-2.5 w-2.5
                bg-red-500
                rounded-full
                ring-2 ring-white
              "
            />
          )}
        </div>
      </h3>

      {loading && <Spinner />}

      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          Không có thông báo mới
        </p>
      )}

      {/* scroll ~ 2 items */}
      <ul className="space-y-2 mt-2 text-sm max-h-28 overflow-y-auto scrollbar-hide">
        {items.map((item) => (
          <li
            key={item.id}
            onClick={() => openNotification(item)}
            className={`px-2 py-1 rounded cursor-pointer
              hover:bg-gray-50
              ${!item.read_at ? "bg-indigo-50" : ""}
            `}
          >
            <p className="font-semibold">{item.title}</p>
            <p className="text-gray-600 line-clamp-2">
              {item.body}
            </p>
          </li>
        ))}
      </ul>

      {nextPage && (
        <button
          onClick={() => fetchNotifications(nextPage)}
          className="mt-2 px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Xem thêm
        </button>
      )}

      {/* MODAL */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        maxWidth="max-w-lg"
      >
        <p className="text-gray-700 mb-4">
          {selected?.body}
        </p>

        <div className="text-xs text-gray-500 space-y-1">
          <p>Type: {selected?.type}</p>
          <p>
            Created:{" "}
            {selected?.created_at &&
              new Date(selected.created_at).toLocaleString()}
          </p>
        </div>
      </Modal>
    </div>
  );
}
