import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold">
          TradePoolNetwork
        </h2>
      </div>

      <nav className="space-y-2 p-4">
        <Link
          href="/member/dashboard"
          className="block rounded-md px-4 py-2 hover:bg-muted"
        >
          Dashboard
        </Link>
    <Link
  href="/member/profile"
  className="block rounded-md px-4 py-2 hover:bg-muted"
>
  Profile
</Link>
        <Link
          href="/member/wallet"
          className="block rounded-md px-4 py-2 hover:bg-muted"
        >
          Wallet
        </Link>

        <Link
          href="/member/deposits"
          className="block rounded-md px-4 py-2 hover:bg-muted"
        >
          Deposits
        </Link>

       
        <Link
          href="/member/sessions"
          className="block rounded-md px-4 py-2 hover:bg-muted"
        >
          Trading Sessions
        </Link>
        <Link
  href="/member/commitments"
  className="block rounded-md px-4 py-2 hover:bg-muted"
>
  My Investments
</Link>
<Link
  href="/member/withdrawal-options"
  className="block rounded-md px-4 py-2 hover:bg-muted"
>
  Withdrawal Options
</Link>

<Link
  href="/member/withdraw"
  className="block rounded-md px-4 py-2 hover:bg-muted"
>
  Withdraw Funds
</Link>
<Link
  href="/member/referrals"
  className="block rounded-md px-4 py-2 hover:bg-muted"
>
  Referrals
</Link>
      </nav>
    </aside>
  );
}