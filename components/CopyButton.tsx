"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
    >
      {copied ? "Copied" : "Copy Token"}
    </button>
  );
}