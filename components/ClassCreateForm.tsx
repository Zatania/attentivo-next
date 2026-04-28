"use client";

import { useState } from "react";

export function ClassCreateForm() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");

    const response = await fetch("/api/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: String(formData.get("name")),
        description: String(formData.get("description") ?? "")
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to create class.");
      return;
    }

    window.location.reload();
  }

  return (
    <form action={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-bold">Create Class</h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <label className="text-sm font-medium">Class Name</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <button className="mt-4 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
        Save Class
      </button>
    </form>
  );
}