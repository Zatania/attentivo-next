"use client";

import { useState } from "react";

export function QuestionCreateForm({ classId }: { classId: string }) {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");

    const response = await fetch("/api/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        classId,
        prompt: String(formData.get("prompt")),
        optionA: String(formData.get("optionA")),
        optionB: String(formData.get("optionB")),
        optionC: String(formData.get("optionC")),
        optionD: String(formData.get("optionD")),
        correctOption: String(formData.get("correctOption"))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to create question.");
      return;
    }

    window.location.reload();
  }

  return (
    <form action={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-bold">Add MCQ</h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

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

      <button className="mt-4 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
        Save MCQ
      </button>
    </form>
  );
}