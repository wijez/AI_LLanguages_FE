import React, { useState } from "react";
import {
  Home,
  Volume2,
  Dumbbell,
  Shield,
  Briefcase,
  Store,
  User,
  MoreHorizontal,
  PlusCircle,
  Newspaper,
  Settings,
  LogOutIcon,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Elephant from "../assets/elephant.svg?url";
import { logout } from "../store/sessionSlice";
import { useDispatch } from "react-redux";
import ConfirmDialog from "../components/ConfirmDialog";

export default function LeftNav() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation(); // defaultNS: 'common'

  // Dùng i18nKey thay cho label tĩnh
  const menuItems = [
    { icon: Home, i18nKey: "nav.learn", path: "/learn", badge: false },
    {
      icon: Volume2,
      i18nKey: "nav.pronunciation",
      path: "/speech",
      badge: false,
    },
    { icon: Dumbbell, i18nKey: "nav.practice", path: "/practice", badge: true },
    { icon: Shield, i18nKey: "nav.rank", path: "/rank", badge: false },
    { icon: Briefcase, i18nKey: "nav.tasks", path: "/task", badge: true },
    { icon: Store, i18nKey: "nav.shop", path: "/shop", badge: false },
    { icon: User, i18nKey: "nav.profile", path: "/profile", badge: false },
    {
      icon: MoreHorizontal,
      i18nKey: "nav.more",
      id: "more",
      badge: false,
      subMenu: [
        { icon: PlusCircle, i18nKey: "nav.addLanguage", path: "/more" },
        { icon: Newspaper, i18nKey: "nav.newsfeed", path: "/newsfeed" },
        { icon: Settings, i18nKey: "nav.setting", path: "/setting" },
        { icon: LogOutIcon, i18nKey: "nav.logout", id: "logout" },
      ],
    },
  ];

  const moreItem = menuItems.find((i) => i.id === "more");
  const isChildActive =
    moreItem?.subMenu?.some((sub) => location.pathname === sub.path) || false;

  const [isManuallyToggled, setIsManuallyToggled] = useState(null);
  const isMoreMenuOpen =
    isManuallyToggled === null ? isChildActive : isManuallyToggled;
  const handleMoreMenuToggle = () => setIsManuallyToggled(!isMoreMenuOpen);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutClose = () => {
    setLogoutDialogOpen(false);
  };

  return (
    <div className="w-full bg-white border-r border-gray-200 p-4 h-screen overflow-y-auto sticky top-0">
      <div className="mb-8">
        <Link to="/learn">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-green-500 cursor-pointer hover:text-green-600 transition-colors">
            <img src={Elephant} alt="Elephant" className="w-24 h-24" /> Aivory
          </h1>
        </Link>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.id === "more") {
            return (
              <div key={index}>
                <button
                  onClick={handleMoreMenuToggle}
                  aria-expanded={isMoreMenuOpen}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isMoreMenuOpen ? "bg-blue-50" : "hover:bg-gray-50"
                  } border-2 border-transparent`}
                >
                  <div
                    className={
                      isMoreMenuOpen ? "text-blue-500" : "text-gray-600"
                    }
                  >
                    <Icon size={24} />
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      isMoreMenuOpen ? "text-blue-500" : "text-gray-600"
                    }`}
                  >
                    {t(item.i18nKey)}
                  </span>
                </button>

                {isMoreMenuOpen && (
                  <div className="pl-10 pt-2 space-y-1">
                    {item.subMenu.map((subItem, subIndex) => {
                      const isSubActive = location.pathname === subItem.path;
                      const SubIcon = subItem.icon;
                      if (subItem.id === "logout") {
                        return (
                          <button
                            key={subIndex}
                            onClick={handleLogoutClick}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                            isSubActive
                              ? "bg-blue-50 text-blue-600 font-semibold"
                              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                          >
                            <subItem.icon size={20} />
                            <span>{t(subItem.i18nKey)}</span>
                          </button>
                        );
                      }
                      return (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                            isSubActive
                              ? "bg-blue-50 text-blue-600 font-semibold"
                              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <SubIcon size={20} />
                          <span>{t(subItem.i18nKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={index} className="relative">
              <Link
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-blue-50 border-2 border-blue-200"
                    : "hover:bg-gray-50 border-2 border-transparent"
                }`}
              >
                <div className={isActive ? "text-blue-500" : "text-gray-600"}>
                  <Icon size={24} />
                </div>
                <span
                  className={`font-bold text-sm ${
                    isActive ? "text-blue-500" : "text-gray-600"
                  }`}
                >
                  {t(item.i18nKey)}
                </span>
              </Link>
              {item.badge && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full pointer-events-none" />
              )}
            </div>
          );
        })}
      </nav>
      <ConfirmDialog
        open={logoutDialogOpen}
        onClose={handleLogoutClose}
        onConfirm={handleLogout}
        title={t("nav.logoutConfirmTitle")}
        message={t("nav.logoutConfirmMessage")}
        confirmText={t("nav.logout")} 
        cancelText={t("nav.cancel")}
      />
    </div>
  );
}
