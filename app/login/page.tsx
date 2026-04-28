import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border-t-4 border-brand bg-white p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          ATTENTIVO
        </p>

        <h1 className="mt-2 text-2xl font-bold">Login</h1>

        <p className="mt-2 text-sm text-slate-600">
          Access your class dashboard and session reports.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-sm text-slate-600">
          No account yet?{" "}
          <Link href="/register" className="font-semibold text-brand">
            Register here
          </Link>
        </p>
      </section>
    </main>
  );
}