import React from "react";

export default function TargetingOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-40"
      onClick={onCancel}
      aria-label="Cancel targeting overlay"
    />
  );
}
