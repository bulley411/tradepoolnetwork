import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { DashboardHeader } from "@/components/member/dashboard-header";
import { Sidebar } from "@/components/member/sidebar";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <DashboardHeader />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}