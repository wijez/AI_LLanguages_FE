import React from 'react'

export default function Spinner() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div
        className="w-12 h-12 rounded-full animate-spin
          border-4 border-solid border-sky-500 border-t-transparent"
        style={{ borderTopColor: "transparent" }} 
      ></div>
    </div>
  )
}
