import React, { useState, useMemo, memo, useEffect } from "react";
import {
  Mail,
  Calendar,
  Clock,
  ShieldCheck,
  PencilLine,
  User2,
  Hash,
  User,
  Check,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../api/api";
import { fetchMeSafe } from "../../store/sessionSlice";
import ProfileMoreMobile from "../Bars/ProfileMoreMobile";
// ========= Dicebear config =========
const DICEBEAR_BASE =
  (import.meta.env && import.meta.env.VITE_DICEBEAR_BASE);

const DICEBEAR_SEEDS = Array.from({ length: 36 }, (_, i) => `user-${i + 1}`);
function buildDicebearThumb(seed) {
  // Thumbs style + size + bo góc + background màu pastel
  // Docs: https://api.dicebear.com/9.x/thumbs/svg :contentReference[oaicite:0]{index=0}
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(
    seed
  )}&size=128&radius=25&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

function InfoCard({ user }) {
  const {
    id,
    username,
    email,
    first_name,
    last_name,
    avatar,
    bio,
    is_active,
    is_staff,
    is_superuser,
    date_joined,
    role,
    _fmt,
  } = user || {};

  const dispatch = useDispatch();
  const offline = useSelector((s) => s.session.offline);

  const fullName = [first_name, last_name].filter(Boolean).join(" ");
  const [imgErr, setImgErr] = useState(false);
  const [showJSON, setShowJSON] = useState(false);

  // ====== State chỉnh sửa hồ sơ ======
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: first_name || "",
    last_name: last_name || "",
    avatar: avatar || "",
    bio: bio || "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Avatar hiện tại cho preview (khi edit dùng form.avatar, còn lại dùng avatar gốc)
  const currentAvatar = editing ? form.avatar || avatar : avatar || form.avatar;

  useEffect(() => {
    // Mỗi lần đổi avatar thì reset lỗi ảnh
    setImgErr(false);
  }, [currentAvatar]);

  const accountRows = useMemo(
    () => [
      { Icon: Hash, label: "ID", value: id != null ? String(id) : "—" },
      { Icon: User, label: "Username", value: username },
      { Icon: Mail, label: "Email", value: email },
      { Icon: ShieldCheck, label: "Role", value: role },
    ],
    [id, username, email, role]
  );

  const activityRows = useMemo(
    () => [
      { Icon: Calendar, label: "Member Since", value: _fmt?.date_joined },
      { Icon: Clock, label: "Last Active", value: _fmt?.last_active },
      { Icon: ShieldCheck, label: "Last Login", value: _fmt?.last_login },
    ],
    [_fmt?.date_joined, _fmt?.last_active, _fmt?.last_login]
  );

  const rawJSON = useMemo(() => {
    if (!showJSON) return "";
    return JSON.stringify(
      {
        id,
        username,
        email,
        first_name,
        last_name,
        avatar,
        bio,
        is_active,
        is_staff,
        is_superuser,
        date_joined,
      },
      null,
      2
    );
  }, [
    showJSON,
    id,
    username,
    email,
    first_name,
    last_name,
    avatar,
    bio,
    is_active,
    is_staff,
    is_superuser,
    date_joined,
  ]);

  // ====== Handlers edit ======
  const handleStartEdit = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setForm({
      first_name: first_name || "",
      last_name: last_name || "",
      avatar: avatar || "",
      bio: bio || "",
    });
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleChangeText = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectAvatar = (url) => {
    setForm((prev) => ({ ...prev, avatar: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (offline) {
      setErrorMsg("Bạn đang offline, không thể cập nhật hồ sơ.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        first_name: form.first_name ?? "",
        last_name: form.last_name ?? "",
        avatar: form.avatar ?? "",
        bio: form.bio ?? "",
      };

      // PATCH /api/users/me/
      await api.Users.updateMe(payload);
      setSuccessMsg("Cập nhật hồ sơ thành công.");
      setEditing(false);

      // reload lại /me cho Redux + Info
      dispatch(fetchMeSafe());
    } catch (err) {
      const data = err?.response?.data;
      const detail =
        data?.detail ||
        (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
        "Cập nhật hồ sơ thất bại, vui lòng thử lại.";
      setErrorMsg(detail);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="w-full h-full overflow-hidden bg-white shadow-xl flex flex-col">
  
<div className="sticky top-0 z-40">
  <div className="relative bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
    <div className="h-36" />

    {/* Avatar center */}
    <div className="absolute inset-x-0 bottom-0 translate-y-1/2 flex justify-center">
      <div className="h-28 w-28 rounded-2xl
                      bg-gradient-to-br from-indigo-400 to-purple-500
                      shadow-lg ring-4 ring-white overflow-hidden
                      flex items-center justify-center">
        {currentAvatar && !imgErr ? (
          <img
            src={currentAvatar}
            alt="avatar"
            className="h-full w-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <User2 className="h-14 w-14 text-white" />
        )}
      </div>
    </div>
  </div>
</div>


        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pt-24 pb-6 flex flex-col">

          {/* Edit button (align right) */}
          <div className="w-full flex justify-end">
            {!editing ? (
              <button
                onClick={handleStartEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 active:scale-[0.98] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={offline}
              >
                <PencilLine className="h-4 w-4" />
                {offline ? "Offline" : "Edit Profile"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                Hủy
              </button>
            )}
          </div>

          {/* Centered role + status badges */}
          <div className="mt-4 flex flex-col items-center">
            {role && (
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-gray-800">
                {role}
              </span>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {is_active && <Pill text="Active" color="green" />}
              {is_staff && <Pill text="Staff" color="indigo" />}
              {is_superuser && <Pill text="Superuser" color="rose" />}
            </div>

            

            {/* Name + username */}
            <div className="mt-4 text-center">
              {fullName && (
                <h1 className="text-2xl font-semibold text-gray-900">
                  {fullName}
                </h1>
              )}
              <p className="text-gray-600">@{username}</p>
            </div>
          </div>
            <section className="mt-8">
            {editing && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {offline && (
                  <p className="text-xs text-amber-600">
                    Bạn đang ở chế độ offline. Thay đổi sẽ không thể lưu lên
                    server.
                  </p>
                )}
                {errorMsg && (
                  <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    {successMsg}
                  </div>
                )}

                {/* Avatar Dicebear */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Avatar (Dicebear Thumbs)
                  </label>
                  <p className="mb-2 text-[11px] text-gray-500">
                    Chọn một avatar từ bộ Dicebear Thumbs. Avatar mới sẽ được
                    lưu dưới dạng URL API của Dicebear.
                  </p>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                    {DICEBEAR_SEEDS.map((seed) => {
                      const url = buildDicebearThumb(
                        `${seed}-${username || "user"}`
                      );
                      const selected = form.avatar === url;
                      return (
                        <button
                          key={seed}
                          type="button"
                          onClick={() => handleSelectAvatar(url)}
                          className={`relative flex items-center justify-center rounded-2xl border-2 p-1 transition hover:border-indigo-300 hover:shadow-sm ${
                            selected
                              ? "border-emerald-500 ring-2 ring-emerald-300"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={url}
                            alt={seed}
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                          {selected && (
                            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tên */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Họ (first_name)
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChangeText}
                      className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nhập họ của bạn"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Tên (last_name)
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChangeText}
                      className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nhập tên của bạn"
                    />
                  </div>
                </div>

                {/* BIO */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Giới thiệu (bio)
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={form.bio}
                    onChange={handleChangeText}
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Viết vài dòng về bản thân, mục tiêu học tập..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed"
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving || offline}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )}

            {!editing && (
              <p className="text-xs text-gray-500">
                Bấm &quot;Edit Profile&quot;, chỉnh sửa tên và phần giới thiệu.
              </p>
            )}
          </section>

          {/* BIO (read-only view) */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              BIO
            </h2>
            <p className="mt-2 text-gray-800">{bio || "—"}</p>
          </section>

          {/* ACCOUNT */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Account
            </h2>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {accountRows.map(({ Icon, label, value }) => (
                <InfoRow key={label} Icon={Icon} label={label} value={value} />
              ))}
            </dl>
          </section>

          {/* ACTIVITY */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Activity
            </h2>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {activityRows.map(({ Icon, label, value }) => (
                <InfoRow key={label} Icon={Icon} label={label} value={value} />
              ))}
            </dl>
          </section>
          <ProfileMoreMobile /> 
          {/* FORM CHỈNH SỬA HỒ SƠ (bao gồm chọn avatar Dicebear) */}
        

          {/* RAW JSON toggle */}
          <section className="mt-8">
            <button
              onClick={() => setShowJSON((v) => !v)}
              className="text-sm text-indigo-600 hover:underline"
              type="button"
            >
              {showJSON ? "Hide Raw JSON" : "Show Raw JSON"}
            </button>
            {showJSON && (
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
                {rawJSON}
              </pre>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const Pill = memo(function Pill({ text, color }) {
  const map = {
    green: "bg-green-100 text-green-700",
    indigo: "bg-indigo-100 text-indigo-700",
    rose: "bg-rose-100 text-rose-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
        map[color] || map.gray
      }`}
    >
      {text}
    </span>
  );
});

const InfoRow = memo(function InfoRow({ Icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <dt className="text-sm text-gray-500">{label}</dt>
        <dd className="truncate text-base font-medium text-gray-900">
          {value ?? "—"}
        </dd>
      </div>
    </div>
  );
});

export default memo(InfoCard);
