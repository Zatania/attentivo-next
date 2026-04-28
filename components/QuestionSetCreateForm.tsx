"use client";

import { FormEvent, useState } from "react";

export function QuestionSetCreateForm({ classId }: { classId: string }) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/question-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          classId,
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? "")
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to create question set.");
        return;
      }

      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-bold">Create Question Set</h2>

      <p className="mt-1 text-sm text-slate-600">
        Use question sets to group MCQs by lesson, topic, or review coverage.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <label className="text-sm font-medium">Set Title</label>
        <input
          name="title"
          required
          placeholder="Example: Lesson 3 - Conditional Statements"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          placeholder="Optional description"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save Question Set"}
      </button>
    </form>
  );
}