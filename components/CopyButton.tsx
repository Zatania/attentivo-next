"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy"
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function copyWithFallback(text: string) {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!successful) {
      throw new Error("Copy failed. Please manually select and copy the token.");
    }
  }

  async function handleCopy() {
    setError("");

    try {
      await copyWithFallback(value);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to copy. Please copy manually."
      );
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {copied ? "Copied" : label}
      </button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}