"use client";

import { useState } from "react";

export function QuestionStatusButton({
  questionId,
  isActive
}: {
  questionId: string;
  isActive: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isActive: !isActive
        })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error ?? "Unable to update question.");
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleStatus}
      disabled={loading}
      className="mt-3 rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading
        ? "Updating..."
        : isActive
          ? "Deactivate"
          : "Reactivate"}
    </button>
  );
}