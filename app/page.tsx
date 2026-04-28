import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user?.role === "TEACHER") {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <section className="mx-auto max-w-4xl rounded-2xl border-t-4 border-brand bg-white p-8 shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            ATTENTIVO
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Welcome back, {user.fullName}
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Manage your classes, start live attention sessions, and review
            session-based attention scores.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/teacher"
              className="rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark"
            >
              Go to Teacher Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (user?.role === "STUDENT") {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <section className="mx-auto max-w-4xl rounded-2xl border-t-4 border-brand bg-white p-8 shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            ATTENTIVO
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Welcome back, {user.fullName}
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Join your class, install the extension, and respond to MCQ attention
            checks during active sessions.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/student"
              className="rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark"
            >
              Go to Student Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <section className="mx-auto max-w-4xl rounded-2xl border-t-4 border-brand bg-white p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          ATTENTIVO
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Attention Tracking for Online Classes
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          ATTENTIVO helps teachers trigger timed MCQ checks during live online
          classes and compute session-based attention scores per class.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg border border-brand px-5 py-3 font-semibold text-brand hover:bg-brand-light"
          >
            Create Account
          </Link>
        </div>
      </section>
    </main>
  );
}