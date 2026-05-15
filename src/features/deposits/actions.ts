"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDeposit(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const amount = Number(
    formData.get("amount")
  );

  const channel = formData.get(
    "channel"
  ) as string;

  const account_name = formData.get(
    "account_name"
  ) as string;

  const bank_name = formData.get(
    "bank_name"
  ) as string;

  const reference = formData.get(
    "reference"
  ) as string;

  const attachment_url = formData.get(
    "attachment_url"
  ) as string;
  const tx_hash = formData.get(
  "tx_hash"
) as string;

const crypto_network = formData.get(
  "crypto_network"
) as string;

  const { error } = await supabase
    .from("deposits")
    .insert({
      user_id: user.id,
      amount,
      channel,

      tx_hash:
  channel === "crypto"
    ? tx_hash
    : null,

crypto_network:
  channel === "crypto"
    ? crypto_network
    : null,
    
      account_name:
        channel === "bank_transfer"
          ? account_name
          : null,

      bank_name:
        channel === "bank_transfer"
          ? bank_name
          : null,

      reference:
        channel === "bank_transfer"
          ? reference
          : null,

      attachment_url:
        channel === "bank_transfer"
          ? attachment_url
          : null,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/member/deposits");

  return { success: true };
}