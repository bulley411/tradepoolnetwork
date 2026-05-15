import { signIn } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold">
          TradePoolNetwork
        </h1>

        <p className="mb-6 text-muted-foreground">
          Sign in to your account
        </p>

        <form action={signIn} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-md border px-4 py-3"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-md border px-4 py-3"
          />

          <button className="w-full rounded-md bg-black py-3 text-white">
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}