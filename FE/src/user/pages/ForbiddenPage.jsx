import React from 'react';
import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800">
      <h1 className="text-6xl font-bold text-red-600">403</h1>
      <h2 className="mt-4 text-2xl font-semibold">Cấm truy cập</h2>
      <p className="mt-2 text-slate-600">
        Rất tiếc, tài khoản của bạn không có quyền truy cập vào khu vực này.
      </p>
      <Link
        to="/learn" // Hoặc trang chủ của bạn
        className="mt-6 px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition"
      >
        Quay về trang học
      </Link>
    </div>
  );
}