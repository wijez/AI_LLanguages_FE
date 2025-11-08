import React from "react";
import { useTranslation } from "react-i18next";
import Quest from "../Cards/Quest";

export default function DailyQuestCard() {
  const { t } = useTranslation();
  return (
    <div className="border-2 border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">{t("daily.title")}</h3>
        <button className="text-blue-500 text-sm font-bold hover:underline">
          {t("daily.viewAll")}
        </button>
      </div>
      <Quest />
      <Quest />
      <Quest />
    </div>
  );
}
