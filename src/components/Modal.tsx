import React from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose} // click outside closes
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-[101] w-full max-w-3xl bg-white rounded-xl shadow-xl border p-4"
        onClick={(e) => e.stopPropagation()} // prevent backdrop close
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title ?? "Modal"}</h3>
          <button
            className="px-2 py-1 text-sm rounded-md border hover:bg-gray-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
