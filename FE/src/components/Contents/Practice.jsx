import React from "react";
import { api } from "../../api/api";
import {
  Loader2,
  BookOpen,
  Bug,
  Target,
  Mic,
  Headphones,
  ListChecks,
  Sparkles,
  Trophy,
} from "lucide-react";

const clsx = (...xs) => xs.filter(Boolean).join(" ");
const getLang = () =>
  typeof window !== "undefined" ? localStorage.getItem("learn") || "en" : "en";

export default function Practice() {
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const lang = getLang();

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    api.Practice.overview({ language: lang, limit: 10 })
      .then((d) => {
        if (!alive) return;
        setData(d || {});
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.response?.data?.detail || e?.message || "Load failed");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [lang]);

  if (loading) {
    return (
      <div className="p-6">
        <Header />
        <SkeletonGrid />
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <Header />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {String(err)}
        </div>
      </div>
    );
  }

  const {
    enrollment,
    xp_today,
    daily_goal,
    srs_due_words,
    word_suggestions,
    common_mistakes,
    weak_skills,
    micro_lessons,
    speak_listen,
  } = data || {};

  const progress = Math.min(
    100,
    Math.round(((xp_today || 0) * 100) / Math.max(1, daily_goal || 1))
  );

  // Fallback: nếu không có SRS due thì hiển thị suggestion preview bên trong card SRS
  const noSRS = !srs_due_words || srs_due_words.length === 0;
  const vocabPreview =
    noSRS && word_suggestions ? word_suggestions.slice(0, 8) : [];

  return (
    <div className="p-6">
      <Header />

      {/* Today Progress */}
      <div className="rounded-2xl border bg-white p-5 mt-4">
        <div className="flex items-center gap-2">
          <Trophy />
          <div className="font-semibold">Tiến độ hôm nay</div>
          <div className="ml-auto text-sm text-gray-500">
            Ngôn ngữ: {enrollment?.language_code?.toUpperCase?.()}
          </div>
        </div>
        <div className="mt-3">
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {xp_today || 0} / {daily_goal || 0} XP
          </div>
        </div>
      </div>

      {/* Grid sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {/* SRS Due */}
        <Card
          title="Ôn từ đến hạn"
          icon={<BookOpen />}
          actionText="Bắt đầu ôn"
          onAction={() => {
            // TODO: open SRS modal
          }}
        >
          <ul className="text-sm space-y-2">
            {(srs_due_words || []).slice(0, 8).map((kw) => (
              <li key={kw.id} className="flex items-center justify-between">
                <div className="truncate">
                  <span className="font-medium">{kw.word?.text}</span>
                  {kw.word?.ipa ? (
                    <span className="ml-2 text-gray-500">/{kw.word.ipa}/</span>
                  ) : null}
                </div>
                {kw.word?.part_of_speech ? (
                  <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100">
                    {kw.word.part_of_speech}
                  </span>
                ) : null}
              </li>
            ))}
            {noSRS && (
              <div className="text-sm text-gray-600">
                Không có từ đến hạn. Gợi ý bắt đầu học:
              </div>
            )}
            {noSRS &&
              vocabPreview.map((w) => (
                <li
                  key={`pv_${w.id}`}
                  className="flex items-center justify-between"
                >
                  <div className="truncate">
                    <span className="font-medium">{w.text}</span>
                    {w.ipa ? (
                      <span className="ml-2 text-gray-500">/{w.ipa}/</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {w.level ? (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-indigo-50 text-indigo-700">
                        {w.level}
                      </span>
                    ) : null}
                    {w.part_of_speech ? (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100">
                        {w.part_of_speech}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
          </ul>
        </Card>

        {/* Word Suggestions */}
        <Card
          title="Từ vựng gợi ý"
          icon={<BookOpen />}
          actionText="Học nhanh"
          onAction={() => {
            // TODO: open Quick Vocab flow
          }}
        >
          <ul className="text-sm space-y-2">
            {(word_suggestions || []).slice(0, 8).map((w) => (
              <li key={w.id} className="flex items-center justify-between">
                <div className="truncate">
                  <span className="font-medium">{w.text}</span>
                  {w.ipa ? (
                    <span className="ml-2 text-gray-500">/{w.ipa}/</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {w.level ? (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-indigo-50 text-indigo-700">
                      {w.level}
                    </span>
                  ) : null}
                  {w.part_of_speech ? (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100">
                      {w.part_of_speech}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
            {(!word_suggestions || word_suggestions.length === 0) && (
              <EmptyLine text="Chưa có gợi ý từ vựng." />
            )}
          </ul>
        </Card>

        {/* Mistakes */}
        <Card
          title="Ôn lỗi hay sai"
          icon={<Bug />}
          actionText="Sửa ngay"
          onAction={() => {
            // TODO: start Mistake drill
          }}
        >
          <ul className="text-sm space-y-2">
            {(common_mistakes || []).slice(0, 8).map((m, i) => (
              <li key={`${m.word_id || "no"}_${i}`} className="flex items-center justify-between">
                <div className="truncate">
                  <span className="font-medium">{m.word_text || `#${m.word_id || "-"}`}</span>
                  <span className="ml-2 text-gray-500">({m.error_type})</span>
                </div>
                <span className="text-xs text-gray-500">{m.times}×</span>
              </li>
            ))}
            {(!common_mistakes || common_mistakes.length === 0) && (
              <EmptyLine text="Chưa có lỗi nổi bật." />
            )}
          </ul>
        </Card>

        {/* Weak Skills */}
        <Card
          title="Drill theo kỹ năng"
          icon={<Target />}
          actionText="Start 5 câu"
          onAction={() => {
            // TODO: open Skill drill
          }}
        >
          <div className="space-y-3">
            {(weak_skills || []).map((w) => (
              <div key={w.skill_tag}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{w.skill_tag}</span>
                  <span className="text-gray-500">
                    {Math.round((w.accuracy || 0) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.round((w.accuracy || 0) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!weak_skills || weak_skills.length === 0) && (
              <EmptyLine text="Độ chính xác các kỹ năng ổn định." />
            )}
          </div>
        </Card>

        {/* Micro Lessons */}
        <Card
          title="Micro-lesson đang dở"
          icon={<ListChecks />}
          actionText="Tiếp tục"
          onAction={() => {
            // TODO: resume lesson
          }}
        >
          <ul className="text-sm space-y-2">
            {(micro_lessons || []).slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span className="truncate">
                  {s.lesson?.title || `Lesson #${s.lesson?.id}`}
                </span>
                <span className="text-xs rounded-full bg-amber-50 text-amber-700 px-2 py-0.5">
                  {s.status}
                </span>
              </li>
            ))}
            {(!micro_lessons || micro_lessons.length === 0) && (
              <EmptyLine text="Không có bài đang dở." />
            )}
          </ul>
        </Card>

        {/* Speak/Listen */}
        <Card
          title="Nói / Nghe (Roleplay nhanh)"
          icon={<Mic />}
          actionText="Bắt đầu"
          onAction={() => {
            // TODO: start roleplay quick
          }}
        >
          <ul className="text-sm space-y-2">
            {(speak_listen || []).slice(0, 6).map((rp) => (
              <li key={rp.id} className="flex items-center justify-between">
                <span className="truncate">{rp.title}</span>
                <span className="text-xs rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5">
                  {rp.level}
                </span>
              </li>
            ))}
            {(!speak_listen || speak_listen.length === 0) && (
              <EmptyLine text="Chưa có roleplay phù hợp." />
            )}
          </ul>
        </Card>

        {/* CTA */}
        <CTA />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <Sparkles className="text-yellow-500" />
      <h1 className="text-xl font-bold">Luyện tập</h1>
      <p className="text-sm text-gray-500">
        Tập trung vào mục tiêu: ôn từ đến hạn, sửa lỗi, drill kỹ năng.
      </p>
    </div>
  );
}

function Card({ title, icon, children, actionText, onAction }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-2">
        {icon}
        <div className="font-semibold">{title}</div>
        {actionText ? (
          <button
            onClick={onAction}
            className="ml-auto text-sm px-3 py-1 rounded-full bg-gray-900 text-white hover:opacity-90"
          >
            {actionText}
          </button>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyLine({ text }) {
  return <div className="text-sm text-gray-500">{text}</div>;
}

function CTA() {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-5 flex items-center gap-3">
      <Headphones />
      <div>
        <div className="font-semibold">Tip</div>
        <div className="text-sm text-gray-600">
          Hãy luyện mỗi khối 3–5 phút. Hoàn thành{" "}
          <span className="font-medium">daily goal</span> để duy trì streak nhé!
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border bg-white p-4 h-40 flex items-center justify-center"
        >
          <Loader2 className="animate-spin mr-2" /> Đang tải…
        </div>
      ))}
    </div>
  );
}
