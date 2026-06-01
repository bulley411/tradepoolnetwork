"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminSidebar() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatingEmail, setImpersonatingEmail] = useState<string>("");

  useEffect(() => {
    const checkImpersonation = () => {
      const hasImpersonate = document.cookie.includes("impersonate_user_id");
      setIsImpersonating(hasImpersonate);
      
      if (hasImpersonate) {
        fetch("/api/admin/users/current-impersonated")
          .then(res => res.json())
          .then(data => {
            if (data.email) setImpersonatingEmail(data.email);
          })
          .catch(() => {});
      }
    };
    
    checkImpersonation();
    const interval = setInterval(checkImpersonation, 1000);
    return () => clearInterval(interval);
  }, []);

  async function stopImpersonating() {
    const response = await fetch("/api/admin/users/stop-impersonate", {
      method: "POST",
    });
    if (response.ok) {
      window.location.href = "/admin/dashboard";
    }
  }

  return (
    <aside className="w-64 border-r bg-background">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

      {isImpersonating && (
        <div className="m-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            🔓 Impersonation Mode Active
          </p>
          {impersonatingEmail && (
            <p className="text-xs text-yellow-700 mt-1">
              Viewing as: {impersonatingEmail}
            </p>
          )}
          <p className="text-xs text-yellow-600 mt-1">
            Any actions you take will affect this user's account.
          </p>
          <button
            onClick={stopImpersonating}
            className="w-full mt-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
          >
            Stop Impersonating
          </button>
        </div>
      )}

      <nav className="space-y-2 p-4">
        <Link href="/admin/dashboard" className="block rounded-md px-4 py-2 hover:bg-muted">
          Dashboard
        </Link>
        <Link href="/admin/deposits" className="block rounded-md px-4 py-2 hover:bg-muted">
          Deposits
        </Link>
        <Link href="/admin/withdrawals" className="block rounded-md px-4 py-2 hover:bg-muted">
          Withdrawals
        </Link>
        <Link href="/admin/users" className="block rounded-md px-4 py-2 hover:bg-muted">
          Users
        </Link>
        <Link href="/admin/sessions" className="block rounded-md px-4 py-2 hover:bg-muted">
          Sessions
        </Link>
        <Link href="/admin/exchange-rate" className="block rounded-md px-4 py-2 hover:bg-muted">
          Exchange Rate
        </Link>
      </nav>
    </aside>
  );
}