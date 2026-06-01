'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface AutoCommitResult {
  userId: string;
  email: string;
  amount: number;
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
}

export async function processAutoCommit(sessionId: string): Promise<{
  success: boolean;
  results: AutoCommitResult[];
  totalCommitted: number;
  error?: string;
}> {
  const adminSupabase = createAdminClient();
  const results: AutoCommitResult[] = [];
  let totalCommitted = 0;
  
  try {
    // Get session details
    const { data: session, error: sessionError } = await adminSupabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return { success: false, results: [], totalCommitted: 0, error: 'Session not found' };
    }
    
    if (session.status !== 'open') {
      return { success: false, results: [], totalCommitted: 0, error: 'Session is not open for commitments' };
    }
    
    // Get all users with auto-commit enabled
    const { data: users, error: usersError } = await adminSupabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        auto_commit_enabled,
        auto_commit_percentage,
        auto_commit_max_amount,
        wallets!inner (available_balance)
      `)
      .eq('auto_commit_enabled', true)
      .eq('is_active', true);
    
    if (usersError) {
      return { success: false, results: [], totalCommitted: 0, error: usersError.message };
    }
    
    if (!users || users.length === 0) {
      return { success: true, results: [], totalCommitted: 0, error: 'No users with auto-commit enabled' };
    }
    
    for (const user of users) {
      const availableBalance = user.wallets?.[0]?.available_balance || 0;
      
      // Calculate commitment amount
      let commitmentAmount = availableBalance * (user.auto_commit_percentage / 100);
      
      // Apply max limit if set
      if (user.auto_commit_max_amount && commitmentAmount > user.auto_commit_max_amount) {
        commitmentAmount = user.auto_commit_max_amount;
      }
      
      // Check minimum commitment
      if (commitmentAmount < (session.min_commitment || 5)) {
        results.push({
          userId: user.id,
          email: user.email,
          amount: 0,
          status: 'skipped',
          reason: `Amount $${commitmentAmount.toFixed(2)} below minimum $${session.min_commitment || 5}`,
        });
        
        // Log skipped commitment
        await adminSupabase
          .from('auto_commit_log')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            amount_committed: 0,
            available_balance_before: availableBalance,
            status: 'skipped',
            reason: `Below minimum: $${commitmentAmount.toFixed(2)} < $${session.min_commitment || 5}`,
          });
        continue;
      }
      
      // Check max commitment
      if (session.max_commitment && commitmentAmount > session.max_commitment) {
        commitmentAmount = session.max_commitment;
      }
      
      // Check if user already has a commitment for this session
      const { data: existingCommitment } = await adminSupabase
        .from('session_commitments')
        .select('id, amount')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();
      
      // Process the commitment
      if (existingCommitment) {
        // Update existing commitment (add to it)
        const newAmount = existingCommitment.amount + commitmentAmount;
        
        // Unlock old amount first
        await adminSupabase.rpc('unlock_user_funds', {
          p_user_id: user.id,
          p_amount: existingCommitment.amount,
        });
        
        // Update commitment
        await adminSupabase
          .from('session_commitments')
          .update({ amount: newAmount })
          .eq('id', existingCommitment.id);
        
        // Lock new total amount
        await adminSupabase.rpc('lock_user_funds', {
          p_user_id: user.id,
          p_amount: newAmount,
        });
        
        totalCommitted += commitmentAmount;
        
        results.push({
          userId: user.id,
          email: user.email,
          amount: commitmentAmount,
          status: 'success',
        });
        
      } else {
        // Create new commitment
        const { error: insertError } = await adminSupabase
          .from('session_commitments')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            amount: commitmentAmount,
          });
        
        if (insertError) {
          results.push({
            userId: user.id,
            email: user.email,
            amount: 0,
            status: 'failed',
            reason: insertError.message,
          });
          continue;
        }
        
        // Lock the funds
        await adminSupabase.rpc('lock_user_funds', {
          p_user_id: user.id,
          p_amount: commitmentAmount,
        });
        
        totalCommitted += commitmentAmount;
        
        results.push({
          userId: user.id,
          email: user.email,
          amount: commitmentAmount,
          status: 'success',
        });
      }
      
      // Log auto-commit action
      await adminSupabase
        .from('auto_commit_log')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          amount_committed: commitmentAmount,
          available_balance_before: availableBalance,
          status: 'success',
        });
      
      // Record ledger entry
      await adminSupabase
        .from('wallet_ledger')
        .insert({
          user_id: user.id,
          type: 'session_locked',
          amount: -commitmentAmount,
          description: `Auto-commit to session: ${session.title}`,
          reference_id: sessionId,
        });
    }
    
    revalidatePath('/admin/sessions');
    return { success: true, results, totalCommitted };
    
  } catch (error) {
    console.error('Auto-commit error:', error);
    return { success: false, results: [], totalCommitted: 0, error: 'Internal server error' };
  }
}