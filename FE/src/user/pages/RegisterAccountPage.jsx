// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { api } from "../../api/api"; //
import { useNavigate } from "react-router-dom"; // Giả sử bạn dùng React Router

/**
 * Trang Đăng Ký
 * Gọi api.UsersApp.post("register/", ...)
 * Chuyển hướng đến /verify?email=... khi thành công
 */
export default function RegisterAccountPage({ logo }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    username.trim().length > 3 &&
    email.includes("@") &&
    password.length >= 6 &&
    password === passwordConfirm &&
    !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      if (password !== passwordConfirm) {
        setError("Mật khẩu xác nhận không khớp.");
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Dùng api.UsersApp.post từ api.js
      await api.UsersApp.post("register/", {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      const trimmedEmail = email.trim();
      const trimmedUsername = username.trim();
      navigate(`/verify?email=${encodeURIComponent(trimmedEmail)}&username=${encodeURIComponent(trimmedUsername)}`);
      
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Không thể đăng ký. Vui lòng thử lại.";
      // Xử lý lỗi validation từ DRF (nếu có)
      if (typeof err?.response?.data === 'object') {
        let errorMsg = [];
        if (err.response.data.username) errorMsg.push(`Username: ${err.response.data.username[0]}`);
        if (err.response.data.email) errorMsg.push(`Email: ${err.response.data.email[0]}`);
        if (err.response.data.password) errorMsg.push(`Password: ${err.response.data.password[0]}`);
        setError(errorMsg.join(" "));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 flex justify-center">
              {logo ?? (
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Tạo tài khoản
                </h1>
              )}
            </div>
            <a
              href="/login"
              className="ml-4 text-sm font-semibold text-sky-600 hover:text-sky-700 border rounded-full px-4 py-2 shadow-sm"
            >
              ĐĂNG NHẬP
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                autoComplete="username"
                placeholder="Tên đăng nhập"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Xác nhận mật khẩu"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
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
              {loading ? "Đang tạo..." : "ĐĂNG KÝ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}