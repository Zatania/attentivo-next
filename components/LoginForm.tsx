"use client";

import { FormEvent, useState } from "react";

type LoginResponse = {
  user?: {
    role: "TEACHER" | "STUDENT";
  };
  error?: string;
};

export function LoginForm() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();

      let data: LoginResponse = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || "Server returned an invalid response.");
      }

      if (!response.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }

      window.location.href =
        data.user?.role === "TEACHER"
          ? "/dashboard/teacher"
          : "/dashboard/student";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to login."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}