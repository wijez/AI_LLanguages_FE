import React from "react";
import { useTranslation } from "react-i18next";

export default function Links() {
  const { t } = useTranslation(); // defaultNS: 'common'

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
      <button className="hover:text-blue-500 uppercase">{t("links.about")}</button>
      <button className="hover:text-blue-500 uppercase">{t("links.shop")}</button>
      <button className="hover:text-blue-500 uppercase">{t("links.effectiveness")}</button>
      <button className="hover:text-blue-500 uppercase">{t("links.jobs")}</button>
      <button className="hover:text-blue-500 uppercase">{t("links.investors")}</button>
      <button className="hover:text-blue-500 uppercase">{t("links.terms")}</button>
    </div>
  );
}
