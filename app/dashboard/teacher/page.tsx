import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClassCreateForm } from "@/components/ClassCreateForm";
import { LogoutButton } from "@/components/LogoutButton";

export default async function TeacherDashboardPage() {
  const teacher = await requireTeacher();

  const classes = await prisma.class.findMany({
    where: {
      teacherId: teacher.id
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      _count: {
        select: {
          enrollments: true,
          sessions: true,
          questions: true
        }
      }
    }
  });

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border-t-4 border-brand bg-white p-6 shadow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">
                Teacher Dashboard
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Welcome, {teacher.fullName}
              </h1>

              <p className="mt-2 text-slate-600">
                Create classes, prepare MCQs, start attention sessions, and
                review session-based reports.
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <ClassCreateForm />

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Your Classes</h2>

            {classes.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-slate-600 shadow">
                No classes yet.
              </div>
            ) : (
              classes.map((item) => (
                <Link
                  key={item.id}
                  href={`/classes/${item.id}`}
                  className="block rounded-2xl bg-white p-6 shadow transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{item.name}</h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {item.description || "No description."}
                      </p>

                      <p className="mt-3 text-sm font-semibold text-brand">
                        Class Code: {item.classCode}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div>
                        <p className="font-bold">{item._count.enrollments}</p>
                        <p className="text-slate-500">Students</p>
                      </div>

                      <div>
                        <p className="font-bold">{item._count.questions}</p>
                        <p className="text-slate-500">MCQs</p>
                      </div>

                      <div>
                        <p className="font-bold">{item._count.sessions}</p>
                        <p className="text-slate-500">Sessions</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}