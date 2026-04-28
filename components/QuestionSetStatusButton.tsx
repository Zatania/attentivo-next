"use client";

import { useState } from "react";

export function QuestionSetStatusButton({
  questionSetId,
  isActive
}: {
  questionSetId: string;
  isActive: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);

    try {
      const response = await fetch(`/api/question-sets/${questionSetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isActive: !isActive
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error ?? "Unable to update question set.");
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
      className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Updating..." : isActive ? "Deactivate Set" : "Reactivate Set"}
    </button>
  );
}