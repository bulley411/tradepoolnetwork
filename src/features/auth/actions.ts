"use server";


import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signIn(
  formData: FormData
) {
  const supabase = await createClient();

  const email = formData.get(
    "email"
  ) as string;

  const password = formData.get(
    "password"
  ) as string;

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    return {
      error: error.message,
    };
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  redirect("/member/dashboard");
}
export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}