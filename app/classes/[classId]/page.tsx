import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionCreateForm } from "@/components/QuestionCreateForm";
import { SessionControls } from "@/components/SessionControls";
import { LiveSessionPanel } from "@/components/LiveSessionPanel";
import { QuestionStatusButton } from "@/components/QuestionStatusButton";
import { QuestionSetCreateForm } from "@/components/QuestionSetCreateForm";
import { QuestionSetStatusButton } from "@/components/QuestionSetStatusButton";

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
      questionSets: {
        orderBy: {
          createdAt: "desc"
        },
        include: {
          questions: {
            orderBy: {
              createdAt: "desc"
            }
          },
          _count: {
            select: {
              questions: true
            }
          }
        }
      },
      enrollments: {
        include: {
          student: true
        },
        orderBy: {
          joinedAt: "desc"
        }
      },
      sessions: {
        orderBy: {
          startedAt: "desc"
        },
        include: {
          questionSet: true,
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
        <Link
          href="/dashboard/teacher"
          className="text-sm font-semibold text-brand"
        >
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
              questionSets={targetClass.questionSets.map((set) => ({
                id: set.id,
                title: set.title,
                isActive: set.isActive,
                _count: {
                  questions: set.questions.filter((question) => question.isActive)
                    .length
                }
              }))}
            />

            <QuestionSetCreateForm classId={targetClass.id} />

            <QuestionCreateForm
              classId={targetClass.id}
              questionSets={targetClass.questionSets.map((set) => ({
                id: set.id,
                title: set.title,
                isActive: set.isActive
              }))}
            />
          </div>

          <div className="space-y-6">
            {activeSession && <LiveSessionPanel sessionId={activeSession.id} />}

            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-bold">Question Sets / Topic Banks</h2>

              <p className="mt-1 text-sm text-slate-600">
                Organize MCQs by lesson or topic. When starting a session,
                choose one set and ATTENTIVO will randomly show 4–5 active MCQs.
              </p>

              {targetClass.questionSets.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  No question sets yet. Create a question set first.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {targetClass.questionSets.map((set) => {
                    const activeQuestions = set.questions.filter(
                      (question) => question.isActive
                    );

                    return (
                      <div key={set.id} className="rounded-xl border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold">{set.title}</h3>

                            <p className="mt-1 text-sm text-slate-600">
                              {set.description || "No description."}
                            </p>

                            <p className="mt-2 text-xs font-semibold text-slate-500">
                              Status: {set.isActive ? "Active" : "Inactive"} ·{" "}
                              {activeQuestions.length} active MCQs ·{" "}
                              {set.questions.length} total MCQs
                            </p>
                          </div>

                          <QuestionSetStatusButton
                            questionSetId={set.id}
                            isActive={set.isActive}
                          />
                        </div>

                        {activeQuestions.length < 4 && (
                          <p className="mt-3 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                            This set needs at least 4 active MCQs before it can
                            be used in a session.
                          </p>
                        )}

                        {set.questions.length === 0 ? (
                          <p className="mt-4 text-sm text-slate-500">
                            No MCQs in this set yet.
                          </p>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {set.questions.map((question) => (
                              <div
                                key={question.id}
                                className="rounded-xl border bg-slate-50 p-4"
                              >
                                <p className="font-medium">{question.prompt}</p>

                                <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                                  <p>A. {question.optionA}</p>
                                  <p>B. {question.optionB}</p>
                                  <p>C. {question.optionC}</p>
                                  <p>D. {question.optionD}</p>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                  <QuestionStatusButton
                                    questionId={question.id}
                                    isActive={question.isActive}
                                  />

                                  <p className="text-xs font-semibold text-slate-500">
                                    Status:{" "}
                                    {question.isActive ? "Active" : "Inactive"}
                                  </p>
                                </div>

                                <p className="mt-2 text-sm font-semibold text-brand">
                                  Correct Answer: {question.correctOption}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                          <td className="py-2">
                            {enrollment.student.fullName}
                          </td>
                          <td className="py-2">
                            {enrollment.student.email}
                          </td>
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
                          <p className="font-bold">{session.status} Session</p>

                          <p className="text-sm text-slate-600">
                            Question Set:{" "}
                            {session.questionSet?.title ?? "Not specified"}
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

                        {session.status === "ENDED" && (
                          <a
                            href={`/api/sessions/${session.id}/report`}
                            className="h-fit rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light"
                          >
                            Export CSV
                          </a>
                        )}
                      </div>

                      {session.scores.length > 0 ? (
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
                                  <td className="py-2">
                                    {score.student.fullName}
                                  </td>
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
                                      ? `${Math.round(
                                          score.averageResponseTimeMs / 1000
                                        )}s`
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
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          No computed scores yet. Scores are generated after the
                          active session is ended.
                        </p>
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