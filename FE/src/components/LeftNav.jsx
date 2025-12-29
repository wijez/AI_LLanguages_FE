import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import Elephant from "../assets/elephant.svg?url";
import { logout } from "../store/sessionSlice";
import ConfirmDialog from "../components/ConfirmDialog";
import "../index.css";
import { MAIN_MENU, MORE_MENU_ITEM } from "../utils/menuConfig";

export default function LeftNav() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const menuItems = [...MAIN_MENU, MORE_MENU_ITEM];

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
  };
  const handleLogoutClick = () => setLogoutDialogOpen(true);
  const handleLogoutClose = () => setLogoutDialogOpen(false);

  const subMenuVariants = {
    hidden: { 
      height: 0, 
      opacity: 0, 
      overflow: "hidden",
      transition: { duration: 0.2, ease: "easeInOut" } 
    },
    visible: {
      height: "auto",
      opacity: 1,
      overflow: "hidden",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    exit: {
      height: 0,
      opacity: 0,
      overflow: "hidden",
      transition: { duration: 0.2, ease: "easeInOut" },
    },
  };

  return (
    <div 
      className="w-full bg-white border-r border-gray-200 p-4 h-screen overflow-y-auto sticky top-0 "
      style={{ scrollbarGutter: 'stable', scrollbarWidth: 'thin' }} 
    >
      {/* Logo Section */}
      <div className="mb-8">
        <Link to="/learn">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-green-500 cursor-pointer hover:text-green-600 transition-colors">
            <motion.img
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
              src={Elephant}
              alt="Elephant"
              className="w-24 h-24"
            />
            Aivory
          </h1>
        </Link>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          // --- MENU MORE (Dropdown) ---
          if (item.id === "more") {
            return (
              <div key={index} className="hidden lg:block">
                <button
                  onClick={handleMoreMenuToggle}
                  aria-expanded={isMoreMenuOpen}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 border-2 ${
                    isMoreMenuOpen 
                      ? "bg-blue-50 border-transparent text-blue-500" 
                      : "hover:bg-gray-50 border-transparent text-gray-600"
                  }`}
                >
                  <motion.div whileHover={{ scale: 1.1 }}>
                     <Icon size={24} />
                  </motion.div>
                  
                  <span className="font-bold text-sm">
                    {t(item.i18nKey)}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isMoreMenuOpen && (
                    <motion.div
                      variants={subMenuVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="pl-10 space-y-1 mt-1"
                    >
                      {item.subMenu.map((subItem, subIndex) => {
                        const isSubActive = location.pathname === subItem.path;
                        const SubIcon = subItem.icon;
                        const itemClass = `block w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                          isSubActive
                            ? "bg-blue-50 text-blue-600 font-semibold"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        }`;

                        if (subItem.id === "logout") {
                          return (
                            <button key={subIndex} onClick={handleLogoutClick} className={itemClass}>
                              <subItem.icon size={20} />
                              <span>{t(subItem.i18nKey)}</span>
                            </button>
                          );
                        }
                        return (
                          <Link key={subIndex} to={subItem.path} className={itemClass}>
                            <SubIcon size={20} />
                            <span>{t(subItem.i18nKey)}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <div key={index} className="relative">
              <Link to={item.path}>
                <motion.div
                  whileHover={{ x: 6 }} 
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-50 border-blue-200 text-blue-500"
                      : "border-transparent text-gray-600 hover:bg-gray-50" // CSS hover ở đây mượt hơn motion
                  }`}
                >
                  <div><Icon size={24} /></div>
                  <span className="font-bold text-sm">
                    {t(item.i18nKey)}
                  </span>
                </motion.div>
              </Link>
              
              {item.badge && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500 pointer-events-none" />
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