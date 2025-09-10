import React from "react";

export default function CardShell({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl shadow-sm border p-4 bg-white flex gap-3 items-start ${
        highlight ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"
      }`}
    >
      {children}
    </div>
  );
}
