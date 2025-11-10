import React from 'react';
import { Link } from 'react-router-dom';
import ElephantSorry from "../assets/elephantsorry.png?url";

export default function NotFound404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-6 md:p-8">
      
      <h1 className="text-5xl md:text-6xl font-bold text-blue-600">404</h1>
      <img 
        src={ElephantSorry} 
        alt="Elephant" 
        className="w-full max-w-sm my-6"
      />  
 
      <h2 className="mt-4 text-xl md:text-2xl font-semibold text-center">
        Trang không tồn tại
      </h2>
      <p className="mt-2 text-slate-600 text-center max-w-md">
        Rất tiếc, chúng tôi không thể tìm thấy trang bạn yêu cầu.
      </p>
      
      <Link
        to="/" 
        className="mt-8 px-5 py-2.5 font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition"
      >
        Quay về trang chủ
      </Link>
    </div>
  )
}