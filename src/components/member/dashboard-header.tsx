"use client";

import { signOut } from "@/features/auth/actions";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-xl font-bold">
        TradePoolNetwork
      </h1>

      <form action={signOut}>
        <button className="rounded-md border px-4 py-2">
          Logout
        </button>
      </form>
    </header>
  );
}