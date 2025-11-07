import React, { useState, useRef, useEffect } from "react";
import { api } from "../../api/api";
import { useSearchParams, useNavigate } from "react-router-dom";

/**
 * Trang nhập mã xác thực 6 số
 * Gọi api.UsersApp.post("verify_user/", ...)
 * Gọi api.UsersApp.post("resend-verify-code/", ...)
 */
export default function VerifyCodePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // [SỬA 2] Lấy cả username và email từ URL
  // Trang RegisterPage phải chuyển hướng đến /verify?username=user01&email=user@example.com
  const email = searchParams.get("email");
  const username = searchParams.get("username"); // API cần trường này

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputsRef = useRef([]);

  // [SỬA 1] Sửa logic: Chấp nhận cả chữ và số (alphanumeric)
  const canSubmit = code.every((c) => c.match(/^[A-Za-z0-9]$/)) && !loading;

  // Xử lý nhập liệu và tự động focus
  const handleChange = (e, index) => {
    const val = e.target.value;

    // [SỬA 1] Sửa logic: Cho phép cả chữ và số
    if (!/^[A-Za-z0-9]?$/.test(val)) return;

    const newCode = [...code];
    newCode[index] = val.toUpperCase(); // Tự động viết hoa
    setCode(newCode);

    // Tự động focus ô tiếp theo
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Xử lý phím Backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // [SỬA 3] Thêm hàm xử lý Paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .trim()
      .toUpperCase()
      .substring(0, 6); // Lấy tối đa 6 ký tự

    if (/^[A-Za-z0-9]{6}$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);
      inputsRef.current[5]?.focus(); // Focus ô cuối cùng
    }
  };

  // Gửi mã xác thực
  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    if (!username) {
      setError("Không tìm thấy username. Vui lòng quay lại trang đăng ký.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fullCode = code.join("");

      // [SỬA 2] Gửi đúng payload mà API yêu cầu (username và code)
      const data = await api.UsersApp.post("verify_user/", {
        username: username, // Gửi username
        verify_code: fullCode, // Gửi verify_code
      });

      // Xác thực thành công, API trả về token
      const access = data?.tokens?.access ?? data?.access ?? null;
      const refresh = data?.tokens?.refresh ?? data?.refresh ?? null;

      if (access) localStorage.setItem("access", access);
      if (refresh) localStorage.setItem("refresh", refresh);

      // Chuyển hướng đến trang chính
      window.location.href = "/";
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Mã xác thực không đúng hoặc đã hết hạn.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Gửi lại mã (vẫn dùng email)
  async function handleResendCode() {
    if (!email) {
      setError("Không tìm thấy email. Vui lòng quay lại trang đăng ký.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Dùng api.UsersApp.post từ api.js
      await api.UsersApp.post("resend-verify-code/", { email });
      setSuccess("Đã gửi lại mã xác thực. Vui lòng kiểm tra email.");
    } catch (err) {
      setError("Không thể gửi lại mã. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] px-8 py-10 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight mb-3">
            Xác thực tài khoản
          </h1>
          <p className="text-gray-600 mb-6">
            Chúng tôi đã gửi mã 6 ký tự đến <b>{email || "email của bạn"}</b>.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-center gap-2 mb-4">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="text"
                  inputMode="text" // Đổi sang "text" để nhận chữ
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  // [SỬA 3] Thêm sự kiện onPaste vào ô đầu tiên
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-semibold rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              ))}
            </div>

            {error && <div className="text-sm text-red-600 my-4">{error}</div>}
            {success && (
              <div className="text-sm text-green-600 my-4">{success}</div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={
                "w-full rounded-xl py-3 font-extrabold text-white shadow transition " +
                (canSubmit
                  ? "bg-sky-500 hover:bg-sky-600"
                  : "bg-sky-300 cursor-not-allowed")
              }
            >
              {loading ? "Đang kiểm tra..." : "XÁC NHẬN"}
            </button>
          </form>

          <div className="mt-6 text-sm">
            <span className="text-gray-600">Không nhận được mã? </span>
            <button
              onClick={handleResendCode}
              disabled={loading}
              className="font-semibold text-sky-600 hover:underline disabled:opacity-50"
            >
              Gửi lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
