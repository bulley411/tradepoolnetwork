"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

  if (!profile || profile.role !== "admin") {
    return null;
  }

  return {
    user,
    profile,
  };
}

export async function approveDeposit(
  depositId: string
) {
  const admin =
    await requireAdminUser();

  if (!admin) {
    return {
      error: "Unauthorized",
    };
  }

  const supabase = await createClient();

  const { data: deposit } =
    await supabase
      .from("deposits")
      .select("*")
      .eq("id", depositId)
      .single();

  if (!deposit) {
    return {
      error: "Deposit not found",
    };
  }

  if (deposit.status === "approved") {
    return {
      error: "Already approved",
    };
  }

  const { error: depositError } =
    await supabase
      .from("deposits")
      .update({
        status: "approved",
        approved_by: admin.user.id,
      })
      .eq("id", depositId);

  if (depositError) {
    return {
      error: depositError.message,
    };
  }

  const { data: wallet } =
    await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", deposit.user_id)
      .single();

  if (!wallet) {
    return {
      error: "Wallet not found",
    };
  }

  const newBalance =
    Number(
      wallet.available_balance
    ) + Number(deposit.amount);

  const { error: walletError } =
    await supabase
      .from("wallets")
      .update({
        available_balance:
          newBalance,
      })
      .eq("id", wallet.id);

  if (walletError) {
    return {
      error: walletError.message,
    };
  }

  // Add ledger entry
    await supabase
      .from('wallet_ledger')
      .insert({
        user_id: deposit.user_id,
        type: 'deposit_credited',
        amount: deposit.amount,
        description: `Deposit approved`,
        reference_id: depositId,
      });

  revalidatePath("/admin/deposits");

  return {
    success: true,
  };
}



export async function rejectDeposit(
  depositId: string
) {
  const admin =
    await requireAdminUser();

  if (!admin) {
    return {
      error: "Unauthorized",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("deposits")
    .update({
      status: "rejected",
      approved_by: admin.user.id,
    })
    .eq("id", depositId);

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/admin/deposits");

  return {
    success: true,
  };
}


// ============================================================
// EXISTING DEPOSIT ACTIONS (keep your current code)
// ============================================================

// ... your existing approveDeposit, etc. ...

// ============================================================
// NEW SESSION ACTIONS
// ============================================================

// Create a new session (draft)
export async function createSession(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    return { error: 'Admin access required' };
  }
  
  const sessionData = {
    title: formData.get('title'),
    description: formData.get('description'),
    asset_class: formData.get('asset_class'),
    min_commitment: Number(formData.get('min_commitment')) || 5,
    max_commitment: formData.get('max_commitment') ? Number(formData.get('max_commitment')) : null,
    status: 'draft',
    created_by: user.id,
  };
  
  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();
  
  if (error) return { error: error.message };
  
  revalidatePath('/admin/sessions');
  return { success: true, session: data };
}

// Open a session for commitments (draft → open)
export async function openSession(sessionId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    return { error: 'Admin access required' };
  }
  
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'open',
      opened_for_commitments_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  
  if (error) return { error: error.message };
  
  revalidatePath('/admin/sessions');
  return { success: true };
}


// Close commitments (open → committed)
export async function closeCommitments(sessionId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return { error: 'Admin access required' };
  }
  
  // DO NOT lock funds here — they were already locked when member committed
  
  // Just update session status
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'committed',
      commitments_closed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  
  if (error) return { error: error.message };
  
  revalidatePath('/admin/sessions');
  return { success: true };
}

// Start trading (committed → trading)
export async function startTrading(sessionId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    return { error: 'Admin access required' };
  }
  
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'trading',
      trading_started_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  
  if (error) return { error: error.message };
  
  revalidatePath('/admin/sessions');
  return { success: true };
}

export async function xendTradingAndDistribute(
  sessionId: string,
  totalProfitLoss: number
) {
  const adminSupabase = createAdminClient();
  
  // Get session
  const { data: session } = await adminSupabase
    .from('sessions')
    .select('id, total_committed, title')
    .eq('id', sessionId)
    .single();
  
  if (!session) return { error: 'Session not found' };
  
  // Get commitments
  const { data: commitments } = await adminSupabase
    .from('session_commitments')
    .select('id, user_id, amount, contribution_pct')
    .eq('session_id', sessionId)
    .eq('status', 'active');
  
  if (!commitments || commitments.length === 0) {
    return { error: 'No commitments found' };
  }
  
  const platformSplit = 0.5;
  
  for (const commitment of commitments) {
    const userShareOfPool = (commitment.contribution_pct || 0) / 100;
    const grossPnlShare = totalProfitLoss * userShareOfPool;
    const platformCut = grossPnlShare * platformSplit;
    const netPayout = grossPnlShare - platformCut;
    
    // Create P&L record
    await adminSupabase
      .from('pnl_records')
      .insert({
        session_id: sessionId,
        user_id: commitment.user_id,
        commitment_id: commitment.id,
        contribution_amount: commitment.amount,
        contribution_pct: commitment.contribution_pct || 0,
        gross_pnl_share: grossPnlShare,
        platform_cut: platformCut,
        net_payout: netPayout,
        status: 'paid',
        paid_at: new Date().toISOString(),
      });
    
    if (netPayout > 0) {
      // PROFIT: Unlock principal + add profit share
      // First, unlock the full principal
      await adminSupabase.rpc('unlock_user_funds', {
        p_user_id: commitment.user_id,
        p_amount: commitment.amount,
      });
      
      // Then add the profit share to available and profit balance
      await adminSupabase.rpc('add_profit_to_wallet', {
        p_user_id: commitment.user_id,
        p_amount: netPayout,
      });
      
    } else if (netPayout < 0) {
      // LOSS: Only return remaining principal
      const remainingAmount = commitment.amount + netPayout; // netPayout is negative
      if (remainingAmount > 0) {
        await adminSupabase.rpc('unlock_user_funds', {
          p_user_id: commitment.user_id,
          p_amount: remainingAmount,
        });
      }
      // No profit added
      
    } else {
      // BREAK EVEN: Return full principal
      await adminSupabase.rpc('unlock_user_funds', {
        p_user_id: commitment.user_id,
        p_amount: commitment.amount,
      });
    }
    
    // Mark commitment as settled
    await adminSupabase
      .from('session_commitments')
      .update({ status: 'settled' })
      .eq('id', commitment.id);
  }
  
  // Update session
  const { error } = await adminSupabase
    .from('sessions')
    .update({
      status: 'settlement',
      trading_ended_at: new Date().toISOString(),
      total_profit_loss: totalProfitLoss,
    })
    .eq('id', sessionId);
  
  if (error) return { error: error.message };
  
  revalidatePath('/admin/sessions');
  return { success: true };
}

export async function endTradingAndDistribute(
  sessionId: string,
  totalProfitLoss: number
) {
  const adminSupabase = createAdminClient();
  
  // Get session
  const { data: session } = await adminSupabase
    .from('sessions')
    .select('id, total_committed, title')
    .eq('id', sessionId)
    .single();
  
  if (!session) return { error: 'Session not found' };
  
  // Get commitments
  const { data: commitments } = await adminSupabase
    .from('session_commitments')
    .select('id, user_id, amount, contribution_pct')
    .eq('session_id', sessionId)
    .eq('status', 'active');
  
  if (!commitments || commitments.length === 0) {
    return { error: 'No commitments found' };
  }
  
  const platformSplit = 0.5;
  const referralCommissionRate = 0.05; // 5%
  
  for (const commitment of commitments) {
    const userShareOfPool = (commitment.contribution_pct || 0) / 100;
    const grossPnlShare = totalProfitLoss * userShareOfPool;
    const platformCut = grossPnlShare * platformSplit;
    const netPayout = grossPnlShare - platformCut;
    
    // Create P&L record
    const { data: pnlRecord } = await adminSupabase
      .from('pnl_records')
      .insert({
        session_id: sessionId,
        user_id: commitment.user_id,
        commitment_id: commitment.id,
        contribution_amount: commitment.amount,
        contribution_pct: commitment.contribution_pct || 0,
        gross_pnl_share: grossPnlShare,
        platform_cut: platformCut,
        net_payout: netPayout,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (netPayout > 0) {
      // PROFIT: Unlock principal + add profit share
      // First, unlock the full principal
      await adminSupabase.rpc('unlock_user_funds', {
        p_user_id: commitment.user_id,
        p_amount: commitment.amount,
      });
      
      // Then add the profit share to available and profit balance
      await adminSupabase.rpc('add_profit_to_wallet', {
        p_user_id: commitment.user_id,
        p_amount: netPayout,
      });
      
    } else if (netPayout < 0) {
      // LOSS: Only return remaining principal
      const remainingAmount = commitment.amount + netPayout; // netPayout is negative
      if (remainingAmount > 0) {
        await adminSupabase.rpc('unlock_user_funds', {
          p_user_id: commitment.user_id,
          p_amount: remainingAmount,
        });
      }
      // No profit added
      
    } else {
      // BREAK EVEN: Return full principal
      await adminSupabase.rpc('unlock_user_funds', {
        p_user_id: commitment.user_id,
        p_amount: commitment.amount,
      });
    }
    
    // ============================================================
    // REFERRAL COMMISSION (5% of platform share)
    // ============================================================
    if (platformCut > 0 && pnlRecord) {
      // Get the referrer (who referred this trader)
      const { data: userProfile } = await adminSupabase
        .from('profiles')
        .select('referred_by')
        .eq('id', commitment.user_id)
        .single();
      
      if (userProfile?.referred_by) {
        const referrerId = userProfile.referred_by;
        const commissionAmount = platformCut * referralCommissionRate;
        
        if (commissionAmount > 0) {
          // Record commission
          await adminSupabase
            .from('referral_commissions')
            .insert({
              referrer_id: referrerId,
              user_id: commitment.user_id,
              pnl_record_id: pnlRecord.id,
              session_id: sessionId,
              commission_amount: commissionAmount,
              status: 'paid',
              paid_at: new Date().toISOString(),
            });
          
          // Add commission to referrer's wallet
          await adminSupabase.rpc('add_referral_commission', {
            p_user_id: referrerId,
            p_amount: commissionAmount,
          });
        }
      }
    }
    
    // Mark commitment as settled
    await adminSupabase
      .from('session_commitments')
      .update({ status: 'settled' })
      .eq('id', commitment.id);
  }
  
  // Update session
  const { error } = await adminSupabase
    .from('sessions')
    .update({
      status: 'settlement',
      trading_ended_at: new Date().toISOString(),
      total_profit_loss: totalProfitLoss,
    })
    .eq('id', sessionId);
  
  if (error) return { error: error.message };
  
  revalidatePath('/admin/sessions');
  return { success: true };
}

// Helper to get referrer (1 tier only)
async function getReferrer(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  
  const { data: user } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', userId)
    .single();
  
  return user?.referred_by || null;
}