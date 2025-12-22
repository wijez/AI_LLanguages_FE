import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import ConfirmDialog from "../ConfirmDialog";
import { logout } from "../../store/sessionSlice";
import { MORE_ACTIONS } from "../../utils/menuConfig";

export default function ProfileMoreMobile() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [openLogout, setOpenLogout] = useState(false);

  const handleClick = (item) => {
    if (item.id === "logout") {
      setOpenLogout(true);
      return;
    }
    navigate(item.path);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <section className="mt-8 lg:hidden">
      {/* Section title – same InfoCard format */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {t("nav.more")}
      </h2>

      {/* Content */}
      <div className="mt-4 space-y-2">
        {MORE_ACTIONS.map((item, idx) => {
          const Icon = item.icon;

          return (
            <button
              key={idx}
              onClick={() => handleClick(item)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                         text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Icon size={20} />
              <span className="font-medium text-sm">
                {t(item.i18nKey)}
              </span>
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        open={openLogout}
        onClose={() => setOpenLogout(false)}
        onConfirm={handleLogout}
        title={t("nav.logoutConfirmTitle")}
        message={t("nav.logoutConfirmMessage")}
        confirmText={t("nav.logout")}
        cancelText={t("nav.cancel")}
      />
    </section>
  );
}
