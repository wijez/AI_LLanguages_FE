import React from "react";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TournamentCard() {
  const { t } = useTranslation();
  const leagueName = t("tournament.name.sapphire"); // ví dụ: Lam Ngọc / Sapphire

  return (
    <div className="border-2 border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">
          {t("tournament.title", { name: leagueName })}
        </h3>
        <button className="text-blue-500 text-sm font-bold hover:underline">
          {t("tournament.viewLeague")}
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
          <Shield className="text-white" size={24} />
        </div>
        <div>
          <p className="font-bold text-gray-800 mb-1">
            {t("tournament.you_ranked", { position: 1 })}
          </p>
          <p className="text-sm text-gray-600">
            {t("tournament.keep_top_n", { n: 3 })}
          </p>
        </div>
      </div>
    </div>
  );
}
