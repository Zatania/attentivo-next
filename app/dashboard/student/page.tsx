import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JoinClassForm } from "@/components/JoinClassForm";

export default async function StudentDashboardPage() {
  const student = await requireStudent();

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
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Student Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold">Welcome, {student.fullName}</h1>
          <p className="mt-2 text-slate-600">
            Join classes, copy your extension token, and review your attention
            performance per session.
          </p>

          {student.extensionToken && (
            <div className="mt-4 rounded-xl bg-brand-light p-4">
              <p className="text-sm font-semibold text-brand">
                Chrome Extension Token
              </p>
              <code className="mt-2 block break-all rounded bg-white px-3 py-2 text-xs">
                {student.extensionToken}
              </code>
            </div>
          )}
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
                <div key={enrollment.id} className="rounded-2xl bg-white p-6 shadow">
                  <h3 className="text-lg font-bold">{enrollment.class.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {enrollment.class.description || "No description."}
                  </p>

                  <div className="mt-4 space-y-3">
                    {enrollment.class.sessions.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No sessions yet.
                      </p>
                    ) : (
                      enrollment.class.sessions.map((session) => {
                        const score = session.scores[0];

                        return (
                          <div key={session.id} className="rounded-xl border p-4">
                            <p className="font-semibold">
                              {session.status} Session
                            </p>
                            <p className="text-sm text-slate-600">
                              Started: {session.startedAt.toLocaleString()}
                            </p>

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