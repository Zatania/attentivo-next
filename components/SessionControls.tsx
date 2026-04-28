"use client";

import { useState } from "react";

export function SessionControls({
  classId,
  activeSessionId
}: {
  classId: string;
  activeSessionId?: string;
}) {
  const [error, setError] = useState("");

  async function startSession(formData: FormData) {
    setError("");

    const intervalSeconds = Number(formData.get("intervalSeconds"));

    const response = await fetch("/api/sessions/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        classId,
        intervalSeconds
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to start session.");
      return;
    }

    window.location.reload();
  }

  async function endSession() {
    if (!activeSessionId) return;

    setError("");

    const response = await fetch("/api/sessions/end", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: activeSessionId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to end session.");
      return;
    }

    window.location.reload();
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-bold">Session Controls</h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {activeSessionId ? (
        <div className="mt-4">
          <p className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            There is an active session for this class.
          </p>

          <button
            onClick={endSession}
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
          >
            End Session and Compute Scores
          </button>
        </div>
      ) : (
        <form action={startSession} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">
              Popup Interval in Seconds
            </label>
            <input
              name="intervalSeconds"
              type="number"
              min={60}
              max={1800}
              defaultValue={300}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-500">
              The system will randomly select 4–5 MCQs and schedule them during
              the live session.
            </p>
          </div>

          <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
            Start Session
          </button>
        </form>
      )}
    </section>
  );
}