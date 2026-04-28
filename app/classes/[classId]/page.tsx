import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionCreateForm } from "@/components/QuestionCreateForm";
import { SessionControls } from "@/components/SessionControls";

type PageProps = {
  params: Promise<{
    classId: string;
  }>;
};

export default async function ClassDetailPage({ params }: PageProps) {
  const teacher = await requireTeacher();
  const { classId } = await params;

  const targetClass = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId: teacher.id
    },
    include: {
      questions: {
        orderBy: {
          createdAt: "desc"
        }
      },
      enrollments: {
        include: {
          student: true
        }
      },
      sessions: {
        orderBy: {
          startedAt: "desc"
        },
        include: {
          scores: {
            include: {
              student: true
            },
            orderBy: {
              attentionScore: "desc"
            }
          }
        }
      }
    }
  });

  if (!targetClass) notFound();

  const activeSession = targetClass.sessions.find(
    (session) => session.status === "ACTIVE"
  );

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-7xl">
        <Link href="/dashboard/teacher" className="text-sm font-semibold text-brand">
          ← Back to Dashboard
        </Link>

        <div className="mt-4 rounded-2xl border-t-4 border-brand bg-white p-6 shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Class Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold">{targetClass.name}</h1>
          <p className="mt-2 text-slate-600">
            {targetClass.description || "No description."}
          </p>
          <p className="mt-4 font-semibold text-brand">
            Class Code: {targetClass.classCode}
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <SessionControls
              classId={targetClass.id}
              activeSessionId={activeSession?.id}
            />

            <QuestionCreateForm classId={targetClass.id} />
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-bold">MCQ Bank</h2>

              {targetClass.questions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  No MCQs yet. Add at least 4 active MCQs before starting a
                  session.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {targetClass.questions.map((question) => (
                    <div key={question.id} className="rounded-xl border p-4">
                      <p className="font-medium">{question.prompt}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        Correct Answer: {question.correctOption}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-bold">Enrolled Students</h2>

              {targetClass.enrollments.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  No students enrolled yet.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Name</th>
                        <th className="py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targetClass.enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="border-b">
                          <td className="py-2">{enrollment.student.fullName}</td>
                          <td className="py-2">{enrollment.student.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-bold">Session Reports</h2>

              {targetClass.sessions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  No sessions recorded yet.
                </p>
              ) : (
                <div className="mt-4 space-y-6">
                  {targetClass.sessions.map((session) => (
                    <div key={session.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <p className="font-bold">
                            {session.status} Session
                          </p>
                          <p className="text-sm text-slate-600">
                            Started: {session.startedAt.toLocaleString()}
                          </p>
                          {session.endedAt && (
                            <p className="text-sm text-slate-600">
                              Ended: {session.endedAt.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {session.scores.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="py-2">Student</th>
                                <th className="py-2">Answered</th>
                                <th className="py-2">Unanswered</th>
                                <th className="py-2">Correct</th>
                                <th className="py-2">Avg. Time</th>
                                <th className="py-2">Attention</th>
                                <th className="py-2">Level</th>
                              </tr>
                            </thead>
                            <tbody>
                              {session.scores.map((score) => (
                                <tr key={score.id} className="border-b">
                                  <td className="py-2">{score.student.fullName}</td>
                                  <td className="py-2">
                                    {score.answeredCount}/{score.totalQuestions}
                                  </td>
                                  <td className="py-2">
                                    {score.unansweredCount}
                                  </td>
                                  <td className="py-2">
                                    {score.correctCount}/{score.totalQuestions}
                                  </td>
                                  <td className="py-2">
                                    {score.averageResponseTimeMs
                                      ? `${Math.round(score.averageResponseTimeMs / 1000)}s`
                                      : "N/A"}
                                  </td>
                                  <td className="py-2">
                                    {score.attentionScore}%
                                  </td>
                                  <td className="py-2">{score.level}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}