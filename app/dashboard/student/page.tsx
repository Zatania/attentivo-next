import { requireStudentPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JoinClassForm } from "@/components/JoinClassForm";
import { CopyButton } from "@/components/CopyButton";
import { LogoutButton } from "@/components/LogoutButton";

export default async function StudentDashboardPage() {
  const student = await requireStudentPage();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: student.id
    },
    include: {
      class: {
        include: {
          sessions: {
            orderBy: {
              startedAt: "desc"
            },
            include: {
              scores: {
                where: {
                  studentId: student.id
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      joinedAt: "desc"
    }
  });

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border-t-4 border-brand bg-white p-6 shadow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">
                Student Dashboard
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Welcome, {student.fullName}
              </h1>

              <p className="mt-2 text-slate-600">
                Join classes, set up your Chrome extension, and review your
                attention performance after each session.
              </p>
            </div>

            <LogoutButton />
          </div>

          {student.extensionToken && (
            <div className="mt-6 rounded-xl bg-brand-light p-4">
              <p className="text-sm font-semibold text-brand">
                Chrome Extension Token
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Paste this token into the ATTENTIVO Chrome extension popup. This
                lets the system identify your Google Meet responses.
              </p>

              <code className="mt-2 block break-all rounded bg-white px-3 py-2 text-xs">
                {student.extensionToken}
              </code>

              <CopyButton value={student.extensionToken} label="Copy Token" />
            </div>
          )}

          <div className="mt-4 rounded-xl border border-brand/20 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">
              How Student Sessions Work
            </p>

            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Your teacher creates a class and starts an ATTENTIVO session.</li>
              <li>You must join the class using the class code.</li>
              <li>You must install the Chrome extension and save your token.</li>
              <li>When you are in Google Meet, timed MCQ popups will appear.</li>
              <li>Answer the popup questions during the live class.</li>
              <li>
                Your score appears here only after the teacher ends the session.
              </li>
            </ol>
          </div>

          <div className="mt-4 rounded-xl border border-brand/20 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">
              Chrome Extension Setup
            </p>

            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Open Chrome and go to chrome://extensions.</li>
              <li>Enable Developer Mode.</li>
              <li>Click Load unpacked.</li>
              <li>Select the chrome-extension folder from this project.</li>
              <li>Open the ATTENTIVO extension popup.</li>
              <li>Paste your extension token and click Save Token.</li>
              <li>Join the Google Meet session using the same Chrome browser.</li>
            </ol>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <JoinClassForm />

          <div className="space-y-4">
            <h2 className="text-xl font-bold">My Classes and Feedback</h2>

            {enrollments.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-slate-600 shadow">
                You are not enrolled in any class yet.
              </div>
            ) : (
              enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-2xl bg-white p-6 shadow"
                >
                  <h3 className="text-lg font-bold">
                    {enrollment.class.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {enrollment.class.description || "No description."}
                  </p>

                  <div className="mt-4 space-y-3">
                    {enrollment.class.sessions.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No sessions yet. Your teacher must start a session
                        before MCQ popups appear in Google Meet.
                      </p>
                    ) : (
                      enrollment.class.sessions.map((session) => {
                        const score = session.scores[0];
                        const isActive = session.status === "ACTIVE";

                        return (
                          <div
                            key={session.id}
                            className="rounded-xl border p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">
                                  {session.status} Session
                                </p>

                                <p className="text-sm text-slate-600">
                                  Started: {session.startedAt.toLocaleString()}
                                </p>
                              </div>

                              {isActive && (
                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                  Open Google Meet
                                </span>
                              )}
                            </div>

                            {isActive && (
                              <p className="mt-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                                This session is active. Keep Google Meet open in
                                Chrome. ATTENTIVO popups will appear through the
                                extension when questions are due.
                              </p>
                            )}

                            {score ? (
                              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg bg-slate-50 p-3">
                                  <p className="text-xs text-slate-500">
                                    Attention Score
                                  </p>

                                  <p className="text-xl font-bold">
                                    {score.attentionScore}%
                                  </p>
                                </div>

                                <div className="rounded-lg bg-slate-50 p-3">
                                  <p className="text-xs text-slate-500">
                                    Level
                                  </p>

                                  <p className="text-xl font-bold">
                                    {score.level}
                                  </p>
                                </div>

                                <div className="rounded-lg bg-slate-50 p-3">
                                  <p className="text-xs text-slate-500">
                                    Correct
                                  </p>

                                  <p className="text-xl font-bold">
                                    {score.correctCount}/{score.totalQuestions}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-slate-500">
                                Score will appear after the teacher ends the
                                session.
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}