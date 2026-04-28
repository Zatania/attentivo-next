import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border-t-4 border-brand bg-white p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          ATTENTIVO
        </p>

        <h1 className="mt-2 text-2xl font-bold">Create Account</h1>

        <p className="mt-2 text-sm text-slate-600">
          Register as a teacher or student.
        </p>

        <div className="mt-6">
          <RegisterForm />
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Login here
          </Link>
        </p>
      </section>
    </main>
  );
}