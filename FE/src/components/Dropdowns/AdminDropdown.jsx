import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@mui/material";
import { Link } from "react-router-dom"; 
import { selectUserView } from "../../store/selectors";
import { logout } from "../../store/sessionSlice";
import { LayoutDashboard, LogOut } from "lucide-react";

export default function AdminDropdown() {
  const user = useSelector(selectUserView);
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(false);

  // Hook để đóng dropdown khi click ra ngoài (Optional nhưng nên có)
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  if (!user) return null;

  // Giả sử role trong DB là tiếng Anh ("User", "Admin")
  const isAdmin = user.role !== "User"; 

  return (
    <div className="relative" ref={menuRef}>
      <Avatar
        src={user.avatar}
        alt={user.username}
        sx={{ cursor: "pointer", width: 36, height: 36 }}
        onClick={() => setOpen((v) => !v)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="
              absolute right-0 mt-2 w-56 
              rounded-xl bg-white shadow-xl 
              border border-gray-100 
              z-50 overflow-hidden
            "
          >
            {/* Header thông tin User */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user.username}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {user.role}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="
                    flex items-center gap-3 w-full text-left px-4 py-2.5 
                    text-sm text-gray-700 
                    hover:bg-indigo-50 hover:text-indigo-600 
                    transition-colors
                  "
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Bảng điều khiển quản trị</span>
                </Link>
              )}

              <button
                className="
                  flex items-center gap-3 w-full text-left px-4 py-2.5 
                  text-sm text-red-600 font-medium
                  hover:bg-red-50 
                  transition-colors
                "
                onClick={() => {
                  setOpen(false);
                  dispatch(logout());
                }}
              >
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}