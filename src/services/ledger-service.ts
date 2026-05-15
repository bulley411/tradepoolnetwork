import { createClient } from "@/lib/supabase/server";

export async function creditWallet({
  userId,
  amount,
  type,
  description,
  referenceId,
  createdBy,
}: {
  userId: string;
  amount: number;
  type: string;
  description?: string;
  referenceId?: string;
  createdBy?: string;
}) {
  const supabase = await createClient();

  // CREATE LEDGER ENTRY
  const { error: ledgerError } =
    await supabase
      .from("wallet_ledger")
      .insert({
        user_id: userId,
        amount,
        type,
        description,
        reference_id: referenceId,
        created_by: createdBy,
      });

  if (ledgerError) {
    return {
      error: ledgerError.message,
    };
  }

  // UPDATE WALLET BALANCE
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!wallet) {
    return {
      error: "Wallet not found",
    };
  }

  const newBalance =
    Number(wallet.available_balance) +
    Number(amount);

  const { error: walletError } =
    await supabase
      .from("wallets")
      .update({
        available_balance: newBalance,
      })
      .eq("id", wallet.id);

  if (walletError) {
    return {
      error: walletError.message,
    };
  }

  return {
    success: true,
  };
}