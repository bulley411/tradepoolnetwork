import { createClient } from "@/lib/supabase/server";

export async function getAllDeposits() {
  const supabase = await createClient();

  // GET DEPOSITS
  const { data: deposits, error } =
    await supabase
      .from("deposits")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

  if (error || !deposits) {
    console.error(error);

    return [];
  }

  // GET USER IDS
  const userIds = deposits.map(
    (deposit) => deposit.user_id
  );

  // GET PROFILES
  const { data: profiles } =
    await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

  // MERGE RESULTS
  const formattedDeposits =
    deposits.map((deposit) => {
      const profile = profiles?.find(
        (p) => p.id === deposit.user_id
      );

      return {
        ...deposit,

        user_email:
          profile?.email ??
          "Unknown User",
      };
    });

  return formattedDeposits;
}