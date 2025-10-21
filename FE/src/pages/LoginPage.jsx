import React, { useState } from "react";
import { api } from "../api/api"; // ← dùng api.js

/**
 * LoginPage – Duolingo-style login screen
 *
 * Props (tùy chọn):
 *  - onSuccess: (payload) => void – callback khi login thành công
 *  - onRedirect: string – đường dẫn redirect sau khi login (nếu không truyền onSuccess)
 *  - logo: ReactNode – custom logo element
 */
export default function LoginPage({
  onSuccess,
  onRedirect = "/",
  logo,
}) {
  const [identifier, setIdentifier] = useState(""); // email hoặc username
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = identifier.trim().length > 0 && password.length >= 1 && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const data = await api.UsersApp.post("login/", {
        username: identifier.trim(),
        password,
      });

      const access = data?.tokens?.access ?? data?.access ?? data?.token ?? null;
      const refresh = data?.tokens?.refresh ?? data?.refresh ?? null;

      if (access) localStorage.setItem("access", access);
      if (refresh) localStorage.setItem("refresh", refresh);

      // Ưu tiên ?next=... trên URL nếu có
      const nextFromQuery =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;

      if (onSuccess) {
        onSuccess(data);
      } else {
        window.location.href = nextFromQuery || onRedirect || "/";
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Không thể đăng nhập. Vui lòng kiểm tra thông tin.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Close icon (optional) */}
        <button
          className="absolute -left-2 -top-2 text-gray-400 hover:text-gray-600 p-2"
          aria-label="Đóng"
          onClick={() =>
            window.history.length > 1
              ? window.history.back()
              : (window.location.href = "/")
          }
        >
          ×
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 flex justify-center">
              {logo ?? (
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Đăng nhập
                </h1>
              )}
            </div>
            <a
              href="/signup"
              className="ml-4 text-sm font-semibold text-sky-600 hover:text-sky-700 border rounded-full px-4 py-2 shadow-sm"
            >
              ĐĂNG KÝ
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="Email hoặc tên đăng nhập"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Mật khẩu"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-16 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                {showPw ? "Ẩn" : "QUÊN?"}
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={
                "w-full rounded-xl py-3 font-extrabold text-white shadow transition " +
                (canSubmit
                  ? "bg-sky-500 hover:bg-sky-600 active:bg-sky-700"
                  : "bg-sky-300 cursor-not-allowed")
              }
            >
              {loading ? "Đang đăng nhập…" : "ĐĂNG NHẬP"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs font-bold text-gray-400 tracking-wider">
              HOẶC
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Logins (wire up to your OAuth routes) */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="#"
              className="rounded-xl border border-gray-200 px-4 py-3 text-center font-semibold hover:bg-gray-50"
            >
              GOOGLE
            </a>
            <a
              href="#"
              className="rounded-xl border border-gray-200 px-4 py-3 text-center font-semibold hover:bg-gray-50"
            >
              FACEBOOK
            </a>
          </div>

          {/* Terms */}
          <p className="mt-6 text-xs text-center text-gray-500 leading-relaxed">
            Khi đăng ký trên nền tảng, bạn đã đồng ý với{" "}
            <span className="font-semibold">Các chính sách</span> và
            <span className="font-semibold"> Chính sách bảo mật</span> của chúng tôi.
            Trang này được bảo vệ bởi reCAPTCHA Enterprise và áp dụng{" "}
            <span className="font-semibold">Chính sách bảo mật</span> và
            <span className="font-semibold"> Điều khoản dịch vụ</span> của Google.
          </p>
        </div>
      </div>
    </div>
  );
}
