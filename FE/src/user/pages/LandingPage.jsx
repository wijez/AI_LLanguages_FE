import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import LanguageDropdown from "../../components/Dropdowns/LanguageDropdown";
import Elephant from "../../assets/elephant.svg?url";
import FullElephant from "../../assets/fullelephant.png?url";

function LangChip({ flag, label, active }) {
  return (
    <button
      className={[
        "h-9 px-3 rounded-xl border",
        active
          ? "bg-white border-gray-300 shadow-sm"
          : "bg-transparent border-transparent hover:bg-gray-50",
      ].join(" ")}
    >
      <span className="mr-2">{flag}</span>
      <span className="font-semibold text-xs">{label}</span>
    </button>
  );
}

export default function LandingPage() {
  const { t } = useTranslation(["common", "landing"]);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full">
        <div className="max-w-[1200px] mx-auto px-4 py-5 flex items-center justify-between">
          {/* <Logo /> */}
          <img src={Elephant} alt="Elephant" className="w-24 h-24" />
          <LanguageDropdown />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-[1200px] mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          {/* left art */}
          <div className="order-2 md:order-1 md:pl-6">
            <img src={FullElephant} alt="FullElephant" />
          </div>

          {/* right text + CTA */}
          <div className="order-1 md:order-2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold leading-snug text-gray-700">
              {t("landing:title")}
            </h1>

            <div className="mt-6 flex flex-col items-center md:items-start gap-3 w-full md:max-w-[420px]">
              <button
                onClick={() => navigate("/register")}
                className="w-full h-12 rounded-2xl bg-[#58cc02] text-white font-extrabold tracking-wide shadow-[inset_0_-5px_0_rgba(0,0,0,0.15)] hover:brightness-105 active:translate-y-[1px] transition-all"
              >
                {t("common:cta.start")}
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full h-12 rounded-2xl border-2 border-gray-200 bg-white text-sky-600 font-extrabold tracking-wide shadow-[0_2px_0_rgba(0,0,0,0.06)] hover:bg-gray-50 transition-all"
              >
                {t("common:cta.login")}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer language rail */}
      <footer className="mt-auto border-t">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-between py-4 text-sm">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
              <LangChip flag="🇺🇸" label={t("landing:footer.english")} active />
              <LangChip flag="🇻🇳" label={t("landing:footer.vietnamese")} />
              <LangChip flag="🇨🇳" label={t("landing:footer.chinese")} />
              <LangChip flag="🇯🇵" label={t("landing:footer.japanese")} />
              <LangChip flag="🇰🇷" label={t("landing:footer.korean")} />
            </div>

            <button className="p-2 rounded-full hover:bg-gray-100">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
