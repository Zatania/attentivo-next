"use client";

import { useEffect, useState } from "react";

type LiveStudent = {
  studentId: string;
  fullName: string;
  email: string;
  answeredCount: number;
  totalQuestions: number;
  correctCount: number;
  progress: number;
};

type LiveSessionData = {
  sessionId: string;
  classId: string;
  questionSetId?: string | null;
  questionSetTitle?: string | null;
  status: string;
  totalQuestions: number;
  students: LiveStudent[];
};

export function LiveSessionPanel({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<LiveSessionData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/live`, {
          cache: "no-store"
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load live session.");
        }

        if (isMounted) {
          setData(result);
          setError("");
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load live session."
          );
        }
      }
    }

    load();

    const timer = window.setInterval(load, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [sessionId]);

  return (
    <section className="rounded-2xl border border-brand/20 bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Live Session Monitor</h2>

          <p className="mt-1 text-sm text-slate-600">
            Updates every 10 seconds while the session is active.
          </p>

          {data?.questionSetTitle && (
            <p className="mt-1 text-sm font-semibold text-brand">
              Question Set: {data.questionSetTitle}
            </p>
          )}
        </div>

        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          Active
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!data && !error && (
        <p className="mt-4 text-sm text-slate-600">Loading live data...</p>
      )}

      {data && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Student</th>
                <th className="py-2">Email</th>
                <th className="py-2">Answered</th>
                <th className="py-2">Correct</th>
                <th className="py-2">Progress</th>
              </tr>
            </thead>

            <tbody>
              {data.students.map((student) => (
                <tr key={student.studentId} className="border-b">
                  <td className="py-2 font-medium">{student.fullName}</td>
                  <td className="py-2 text-slate-600">{student.email}</td>
                  <td className="py-2">
                    {student.answeredCount}/{student.totalQuestions}
                  </td>
                  <td className="py-2">{student.correctCount}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-brand"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span>{student.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.students.length === 0 && (
            <p className="py-4 text-sm text-slate-600">
              No students are enrolled in this class.
            </p>
          )}
        </div>
      )}
    </section>
  );
}