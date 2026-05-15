export type DepositChannel =
  | "bank_transfer"
  | "crypto";

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  channel: DepositChannel;

  account_name?: string;
  bank_name?: string;
  reference?: string;
  attachment_url?: string;

  status: "pending" | "approved" | "rejected";

  created_at: string;
}