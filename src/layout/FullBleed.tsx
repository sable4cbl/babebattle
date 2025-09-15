import React from "react";

/**
 * FullBleed makes its children span the entire viewport width,
 * even if an ancestor uses a centered max-width container.
 * It uses the “negative half viewport” trick to break out.
 */
export default function FullBleed({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {children}
    </div>
  );
}
