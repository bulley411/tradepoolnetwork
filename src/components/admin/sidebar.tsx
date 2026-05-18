import Link from "next/link";

export function AdminSidebar() {
  return (
    <aside className="w-64 border-r bg-background">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold">
          Admin Panel
        </h2>
      </div>

      <nav className="space-y-2 p-4">
        <Link
          href="/admin/dashboard"
          className="block rounded-md px-4 py-2 hover:bg-muted"
        >
          Dashboard
        </Link>

        <Link
          href="/admin/deposits"
          className="block rounded-md px-4 py-2 hover:bg-muted"
        >
          Deposits
        </Link>

        <Link
          href="/admin/withdrawals"
          className="block rounded-md px-4 py-2 hover:bg-muted"
        >
          Withdrawals
        </Link>

        <Link
          href="/admin/users"
          className="block rounded-md px-4 py-2 hover:bg-muted"
        >
          Users
        </Link>

        <Link
          href="/admin/sessions"
          className="block rounded-md px-4 py-2 hover:bg-muted"
        >
          Sessions
        </Link>
        <Link
  href="/admin/withdrawals"
  className="block rounded-md px-4 py-2 hover:bg-muted"
>
  Withdrawals
</Link>
<Link
  href="/admin/exchange-rate"
  className="block rounded-md px-4 py-2 hover:bg-muted"
>
  Exchange Rate
</Link>
      </nav>
    </aside>
  );
}