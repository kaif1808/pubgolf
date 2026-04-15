"use client";

export default function PrintButton() {
  return (
    <button type="button" className="pg-btn text-sm" onClick={() => window.print()}>
      Print scorecard
    </button>
  );
}
