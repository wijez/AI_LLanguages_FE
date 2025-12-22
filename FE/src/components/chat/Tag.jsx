import React from "react";
import { clsx } from "./utils";

export const Tag = ({ children, color = "" }) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
      color || "bg-slate-100 text-slate-600"
    )}
  >
    {children}
  </span>
);