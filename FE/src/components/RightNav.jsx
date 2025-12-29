import React from "react";
import { useTranslation } from "react-i18next";
import StatsBar from "./Bars/StatsBar";
import Links from "./Footers/Links";
import { NotificationsPanel, CalendarPanel} from "../lazy"

function RightNav() {
  const { t } = useTranslation(); 
  const learn =
    typeof window !== "undefined"
      ? (localStorage.getItem("learn") || "").split("-")[0] || undefined
      : undefined;

  return (
    <div
      className="w-full h-screen overflow-y-auto bg-white border-l border-gray-200 p-4 lg:p-6 space-y-4 lg:space-y-6 sticky top-0"
      aria-label={t("nav.more")} 
    >
      <StatsBar languageCode={learn} className="mb-2" />
      <NotificationsPanel />
      <CalendarPanel />
      <Links />
    </div>
  );
}

export default React.memo(RightNav);
