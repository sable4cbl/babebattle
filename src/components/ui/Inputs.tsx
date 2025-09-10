import React, { useState } from "react";

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      className={`border rounded-lg px-2 py-1 text-sm w-full ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      className="border rounded-lg px-2 py-1 text-sm w-24"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value || "0"))}
      type="number"
      step={step}
      min={min}
      max={max}
    />
  );
}

export function Copyable({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`text-[10px] px-1.5 py-0.5 rounded border ${
        copied ? "border-green-400 text-green-600" : "border-gray-300 text-gray-600"
      }`}
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 800);
      }}
      title="Copy"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
