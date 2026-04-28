"use client";

import { useState } from "react";

export function JoinClassForm() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");

    const response = await fetch("/api/classes/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        classCode: String(formData.get("classCode"))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to join class.");
      return;
    }

    window.location.reload();
  }

  return (
    <form action={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-bold">Join Class</h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <label className="text-sm font-medium">Class Code</label>
        <input
          name="classCode"
          required
          placeholder="ATTN-XXXXXX"
          className="mt-1 w-full rounded-lg border px-3 py-2 uppercase"
        />
      </div>

      <button className="mt-4 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
        Join
      </button>
    </form>
  );
}