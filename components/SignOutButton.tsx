"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="btn-ghost text-sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      {label}
    </button>
  );
}
