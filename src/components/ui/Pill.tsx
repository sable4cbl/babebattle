import React from "react";

export default function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs">
      {children}
    </span>
  );
}
