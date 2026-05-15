export type UserRole =
  | "member"
  | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  phone: string | null;
  role: UserRole;
  referral_code: string | null;
  referred_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  available_balance: number;
locked_balance: number;
  profit_balance: number;
  referral_balance: number;
  created_at: string;
}