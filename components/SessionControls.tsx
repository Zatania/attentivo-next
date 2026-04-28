"use client";

import { FormEvent, useState } from "react";

type ApiResponse = {
  success?: boolean;
  error?: string;
};

type QuestionSetOption = {
  id: string;
  title: string;
  isActive: boolean;
  _count?: {
    questions: number;
  };
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
  activeSessionId,
  questionSets
}: {
  classId: string;
  activeSessionId?: string;
  questionSets: QuestionSetOption[];
}) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const usableQuestionSets = questionSets.filter(
    (set) => set.isActive && (set._count?.questions ?? 0) >= 4
  );

  async function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    const questionSetId = String(formData.get("questionSetId") ?? "");
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
          questionSetId,
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
          {usableQuestionSets.length === 0 ? (
            <p className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              Create an active question set with at least 4 active MCQs before
              starting a session.
            </p>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium">
                  Question Set / Topic Bank
                </label>

                <select
                  name="questionSetId"
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  {usableQuestionSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.title} ({set._count?.questions ?? 0} MCQs)
                    </option>
                  ))}
                </select>

                <p className="mt-1 text-xs text-slate-500">
                  ATTENTIVO will randomly choose 4–5 active MCQs from this set.
                </p>
              </div>

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
                  Use 5 minutes for testing, 120 minutes for a two-hour class.
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
                  Recommended: 300 seconds for real classes, 60 seconds for
                  testing.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Starting Session..." : "Start Session"}
              </button>
            </>
          )}
        </form>
      )}
    </section>
  );
}