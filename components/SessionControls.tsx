"use client";

import { FormEvent, useState } from "react";

type ApiResponse = {
  success?: boolean;
  error?: string;
};

async function readJsonSafely(response: Response): Promise<ApiResponse> {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      error: text || "Server returned an invalid response."
    };
  }
}

export function SessionControls({
  classId,
  activeSessionId
}: {
  classId: string;
  activeSessionId?: string;
}) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    const intervalSeconds = Number(formData.get("intervalSeconds"));
    const plannedDurationMinutes = Number(
      formData.get("plannedDurationMinutes")
    );

    try {
      const response = await fetch("/api/sessions/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          classId,
          intervalSeconds,
          plannedDurationMinutes
        })
      });

      const data = await readJsonSafely(response);

      if (!response.ok) {
        setError(data.error ?? "Unable to start session.");
        return;
      }

      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  }

  async function endSession() {
    if (!activeSessionId) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/sessions/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: activeSessionId
        })
      });

      const data = await readJsonSafely(response);

      if (!response.ok) {
        setError(data.error ?? "Unable to end session.");
        return;
      }

      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-bold">Session Controls</h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {activeSessionId ? (
        <div className="mt-4">
          <p className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            There is an active session for this class. Students should keep
            Google Meet open in Chrome. Popups will appear when scheduled
            questions become due.
          </p>

          <button
            type="button"
            onClick={endSession}
            disabled={isLoading}
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Ending Session..." : "End Session and Compute Scores"}
          </button>
        </div>
      ) : (
        <form onSubmit={startSession} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">
              Expected Google Meet Duration in Minutes
            </label>

            <input
              name="plannedDurationMinutes"
              type="number"
              min={5}
              max={240}
              defaultValue={120}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />

            <p className="mt-1 text-xs text-slate-500">
              ATTENTIVO will randomly spread 4–5 MCQ popups across this session
              duration. Use 5 minutes for testing.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">
              Fallback Popup Interval in Seconds
            </label>

            <input
              name="intervalSeconds"
              type="number"
              min={30}
              max={1800}
              defaultValue={300}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />

            <p className="mt-1 text-xs text-slate-500">
              This is still stored for scoring and fallback timing. Recommended:
              300 seconds for real classes, 60 seconds for testing.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Starting Session..." : "Start Session"}
          </button>
        </form>
      )}
    </section>
  );
}