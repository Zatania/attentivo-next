"use client";

import { useState } from "react";

export function RegisterForm() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");

    const role = String(formData.get("role")) as "TEACHER" | "STUDENT";

    const payload = {
      fullName: String(formData.get("fullName")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      role
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Registration failed.");
      return;
    }

    window.location.href =
      data.user.role === "TEACHER"
        ? "/dashboard/teacher"
        : "/dashboard/student";
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Full Name</label>
        <input
          name="fullName"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

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
          minLength={8}
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Role</label>
        <select
          name="role"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          defaultValue="STUDENT"
        >
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
        </select>
      </div>

      <button className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
        Create Account
      </button>
    </form>
  );
}