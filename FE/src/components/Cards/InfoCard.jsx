  import React, { useState, memo, useMemo } from "react";
  import {
    Mail,
    Calendar,
    Clock,
    ShieldCheck,
    PencilLine,
    User2,
    Hash,
    User,
  } from "lucide-react";

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

    const fullName = [first_name, last_name].filter(Boolean).join(" ");
    const [imgErr, setImgErr] = useState(false);
    const [showJSON, setShowJSON] = useState(false);

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
          date_joined
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
      date_joined
    ]);

    return (
      <div className="w-full">
        <div
          className="w-full overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col
                        min-h-[calc(100vh-112px)] md:min-h-[calc(100vh-48px)]"
        >
          {/* Header gradient + avatar center */}
          <div className="relative">
            <div className="h-36 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500" />
            <div className="absolute inset-x-0 -bottom-14 flex justify-center">
              <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg ring-4 ring-white overflow-hidden flex items-center justify-center">
                {avatar && !imgErr ? (
                  <img
                    src={avatar}
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

          {/* Body */}
          <div className="flex-1 px-6 pt-20 pb-6 flex flex-col">
            {/* Edit button (align right) */}
            <div className="w-full">
              <button
                onClick={() => {}}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 active:scale-[0.98] transition"
              >
                <PencilLine className="h-4 w-4" />
                Edit Profile
              </button>
            </div>

            {/* Centered role + status badges */}
            <div className="mt-4 flex flex-col items-center">
              {/* Role under avatar */}
              {role && (
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-gray-800">
                  {role}
                </span>
              )}
              {/* Active / Staff under role */}
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

            {/* BIO */}
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

            {/* RAW JSON toggle */}
            <section className="mt-8">
              <button
                onClick={() => setShowJSON((v) => !v)}
                className="text-sm text-indigo-600 hover:underline"
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
