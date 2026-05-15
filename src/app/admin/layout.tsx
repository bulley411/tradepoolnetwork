import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { DashboardHeader } from "@/components/member/dashboard-header";

import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
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

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

  if (!profile || profile.role !== "admin") {
    redirect("/member/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />

      <div className="flex-1">
        <DashboardHeader />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}