"use client";

import { FormEvent, useState } from "react";

type QuestionSetOption = {
  id: string;
  title: string;
  isActive: boolean;
};

export function QuestionCreateForm({
  classId,
  questionSets
}: {
  classId: string;
  questionSets: QuestionSetOption[];
}) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeQuestionSets = questionSets.filter((item) => item.isActive);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          classId,
          questionSetId: String(formData.get("questionSetId") ?? ""),
          prompt: String(formData.get("prompt") ?? ""),
          optionA: String(formData.get("optionA") ?? ""),
          optionB: String(formData.get("optionB") ?? ""),
          optionC: String(formData.get("optionC") ?? ""),
          optionD: String(formData.get("optionD") ?? ""),
          correctOption: String(formData.get("correctOption") ?? "A")
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to create question.");
        return;
      }

      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-bold">Add MCQ</h2>

      <p className="mt-1 text-sm text-slate-600">
        Select the lesson/topic set where this MCQ belongs.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {activeQuestionSets.length === 0 ? (
        <p className="mt-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          Create an active question set first before adding MCQs.
        </p>
      ) : (
        <>
          <div className="mt-4">
            <label className="text-sm font-medium">Question Set</label>
            <select
              name="questionSetId"
              required
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {activeQuestionSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">Question</label>
            <textarea
              name="prompt"
              required
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          {["A", "B", "C", "D"].map((letter) => (
            <div key={letter} className="mt-3">
              <label className="text-sm font-medium">Option {letter}</label>
              <input
                name={`option${letter}`}
                required
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>
          ))}

          <div className="mt-3">
            <label className="text-sm font-medium">Correct Option</label>
            <select
              name="correctOption"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              defaultValue="A"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save MCQ"}
          </button>
        </>
      )}
    </form>
  );
}