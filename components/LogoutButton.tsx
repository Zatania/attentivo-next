"use client";

import { useState } from "react";

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to logout.");
      }

      window.location.href = "/login";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to logout."
      );
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}