'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Get all open sessions for members to commit to
export async function getOpenSessions() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', sessions: [] };
  
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  
  if (error) return { error: error.message, sessions: [] };
  
  // Get user's existing commitments for these sessions
  const sessionIds = sessions.map(s => s.id);
  
  const { data: existingCommitments } = await supabase
    .from('session_commitments')
    .select('session_id, amount')
    .eq('user_id', user.id)
    .in('session_id', sessionIds);
  
  const commitmentMap = new Map();
  existingCommitments?.forEach(c => {
    commitmentMap.set(c.session_id, c.amount);
  });
  
  // Get user's wallet balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('available_balance')
    .eq('user_id', user.id)
    .single();
  
  return {
    sessions: sessions.map(session => ({
      ...session,
      user_committed_amount: commitmentMap.get(session.id) || 0,
    })),
    availableBalance: wallet?.available_balance || 0,
    error: null,
  };
}

// Commit funds to a session
export async function xcommitToSession(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const sessionId = formData.get('session_id') as string;
  const amount = Number(formData.get('amount'));
  
  if (!sessionId || !amount || amount <= 0) {
    return { error: 'Invalid amount' };
  }
  
  // Check if session exists and is open
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  if (sessionError || !session) {
    return { error: 'Session not found' };
  }
  
  if (session.status !== 'open') {
    return { error: 'Session is not open for commitments' };
  }
  
  // Check minimum commitment
  if (amount < (session.min_commitment || 5)) {
    return { error: `Minimum commitment is $${session.min_commitment || 5}` };
  }
  
  // Check maximum commitment
  if (session.max_commitment && amount > session.max_commitment) {
    return { error: `Maximum commitment is $${session.max_commitment}` };
  }
  
  // Check user's wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('available_balance')
    .eq('user_id', user.id)
    .single();
  
  if (walletError || !wallet) {
    return { error: 'Wallet not found' };
  }
  
  if (wallet.available_balance < amount) {
    return { error: `Insufficient balance. Available: $${wallet.available_balance}` };
  }
  
  // Check if user already committed to this session
  const { data: existingCommitment } = await supabase
    .from('session_commitments')
    .select('id, amount')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single();
  
  if (existingCommitment) {
    // Update existing commitment
    const newAmount = existingCommitment.amount + amount;
    
    if (session.max_commitment && newAmount > session.max_commitment) {
      return { error: `Total commitment cannot exceed $${session.max_commitment}` };
    }
    
    // First, unlock the old amount
    await supabase.rpc('unlock_user_funds', {
      p_user_id: user.id,
      p_amount: existingCommitment.amount,
    });
    
    // Update commitment
    const { error: updateError } = await supabase
      .from('session_commitments')
      .update({ amount: newAmount })
      .eq('id', existingCommitment.id);
    
    if (updateError) return { error: updateError.message };
    
    // Lock the new amount
    await supabase.rpc('lock_user_funds', {
      p_user_id: user.id,
      p_amount: newAmount,
    });
    
  } else {
    // Create new commitment
    const { error: insertError } = await supabase
      .from('session_commitments')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        amount: amount,
      });
    
    if (insertError) return { error: insertError.message };
    
    // Lock the funds
    await supabase.rpc('lock_user_funds', {
      p_user_id: user.id,
      p_amount: amount,
    });
  }
  
  // Record transaction in ledger
  await supabase
    .from('wallet_ledger')
    .insert({
      user_id: user.id,
      type: 'session_locked',
      amount: -amount,
      description: `Committed to session: ${session.title}`,
      reference_id: sessionId,
    });
  
  revalidatePath('/member/sessions');
  revalidatePath('/member/dashboard');
  
  return { success: true };
}

// Commit funds to a session
export async function commitToSession(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const sessionId = formData.get('session_id') as string;
  const amount = Number(formData.get('amount'));
  
  if (!sessionId || !amount || amount <= 0) {
    return { error: 'Invalid amount' };
  }
  
  // Check if session exists and is open
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  if (sessionError || !session) {
    return { error: 'Session not found' };
  }
  
  if (session.status !== 'open') {
    return { error: 'Session is not open for commitments' };
  }
  
  // Check minimum commitment
  if (amount < (session.min_commitment || 5)) {
    return { error: `Minimum commitment is $${session.min_commitment || 5}` };
  }
  
  // Check if user already committed to this session
  const { data: existingCommitment } = await supabase
    .from('session_commitments')
    .select('id, amount')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single();
  
  let newAmount = amount;
  let isAdditional = false;
  
  if (existingCommitment) {
    // User already has a commitment — add to it
    newAmount = existingCommitment.amount + amount;
    isAdditional = true;
    
    // Check max commitment limit
    if (session.max_commitment && newAmount > session.max_commitment) {
      return { error: `Total commitment cannot exceed $${session.max_commitment}` };
    }
  } else {
    // New commitment — check max limit
    if (session.max_commitment && amount > session.max_commitment) {
      return { error: `Maximum commitment is $${session.max_commitment}` };
    }
  }
  
  // Check user's wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('available_balance')
    .eq('user_id', user.id)
    .single();
  
  if (walletError || !wallet) {
    return { error: 'Wallet not found' };
  }
  
  // For additional commitments, only check the new amount (not total)
  const amountToCheck = isAdditional ? amount : newAmount;
  
  if (wallet.available_balance < amountToCheck) {
    return { error: `Insufficient balance. Available: $${wallet.available_balance}` };
  }
  
  // Perform the transaction
  if (existingCommitment) {
    // UPDATE existing commitment
    // First, unlock the old amount (return to available)
    await supabase.rpc('unlock_user_funds', {
      p_user_id: user.id,
      p_amount: existingCommitment.amount,
    });
    
    // Then lock the new total amount
    await supabase.rpc('lock_user_funds', {
      p_user_id: user.id,
      p_amount: newAmount,
    });
    
    // Update the commitment record
    const { error: updateError } = await supabase
      .from('session_commitments')
      .update({ 
        amount: newAmount,
        contribution_pct: 0 // Will be recalculated by trigger
      })
      .eq('id', existingCommitment.id);
    
    if (updateError) {
      // Rollback: unlock the new amount and relock old
      await supabase.rpc('unlock_user_funds', {
        p_user_id: user.id,
        p_amount: newAmount,
      });
      await supabase.rpc('lock_user_funds', {
        p_user_id: user.id,
        p_amount: existingCommitment.amount,
      });
      return { error: updateError.message };
    }
    
    // Record ledger entry for additional commitment
    await supabase
      .from('wallet_ledger')
      .insert({
        user_id: user.id,
        type: 'session_locked',
        amount: -amount,
        description: `Additional commitment to session: ${session.title} (Total: $${newAmount})`,
        reference_id: sessionId,
      });
    
  } else {
    // INSERT new commitment
    const { error: insertError } = await supabase
      .from('session_commitments')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        amount: newAmount,
      });
    
    if (insertError) return { error: insertError.message };
    
    // Lock the funds
    await supabase.rpc('lock_user_funds', {
      p_user_id: user.id,
      p_amount: newAmount,
    });
    
    // Record ledger entry
    await supabase
      .from('wallet_ledger')
      .insert({
        user_id: user.id,
        type: 'session_locked',
        amount: -newAmount,
        description: `Committed to session: ${session.title}`,
        reference_id: sessionId,
      });
  }
  
  revalidatePath('/member/sessions');
  revalidatePath('/member/dashboard');
  revalidatePath('/member/commitments');
  
  return { success: true, newTotal: newAmount, isAdditional };
}

// Get member's active commitments (locked funds)
export async function getMyActiveCommitments() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', commitments: [] };
  
  // Step 1: Get commitments
  const { data: commitments, error: commitmentsError } = await supabase
    .from('session_commitments')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('committed_at', { ascending: false });
  
  if (commitmentsError) {
    console.error('Commitments error:', commitmentsError);
    return { error: commitmentsError.message, commitments: [] };
  }
  
  if (!commitments || commitments.length === 0) {
    return { commitments: [], error: null };
  }
  
  // Step 2: Get unique session IDs
  const sessionIds = [...new Set(commitments.map(c => c.session_id))];
  console.log(sessionIds);
  // Step 3: Fetch sessions separately
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, title, status, total_committed')
    .in('id', sessionIds);
  
  if (sessionsError) {
    console.error('Sessions error:', sessionsError);
    return { error: sessionsError.message, commitments: [] };
  }
  console.log(sessions);
  // Step 4: Create a map for quick lookup
  const sessionMap = new Map();
  sessions?.forEach(session => {
    sessionMap.set(session.id, session);
  });
  
  // Step 5: Combine the data
  const commitmentsWithSessions = commitments.map(commitment => ({
    ...commitment,
    session: sessionMap.get(commitment.session_id) || {
      title: 'Session Not Found',
      status: 'unknown',
      total_committed: 0
    }
  }));
  
  return { commitments: commitmentsWithSessions, error: null };
}

// Get member's settled sessions history
export async function getMySettledSessions() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', history: [] };
  
  // Step 1: Get P&L records
  const { data: pnlRecords, error: pnlError } = await supabase
    .from('pnl_records')
    .select('*')
    .eq('user_id', user.id)
    .order('calculated_at', { ascending: false })
    .limit(20);
  
  if (pnlError) {
    console.error('PNL error:', pnlError);
    return { error: pnlError.message, history: [] };
  }
  
  if (!pnlRecords || pnlRecords.length === 0) {
    return { history: [], error: null };
  }
  
  // Step 2: Get unique session IDs
  const sessionIds = [...new Set(pnlRecords.map(r => r.session_id))];
  
  // Step 3: Fetch sessions separately
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, title, total_profit_loss')
    .in('id', sessionIds);
  
  if (sessionsError) {
    console.error('Sessions error:', sessionsError);
    return { error: sessionsError.message, history: [] };
  }
  
  // Step 4: Create a map for quick lookup
  const sessionMap = new Map();
  sessions?.forEach(session => {
    sessionMap.set(session.id, session);
  });
  
  // Step 5: Combine the data
  const historyWithSessions = pnlRecords.map(record => ({
    ...record,
    session: sessionMap.get(record.session_id) || {
      title: 'Session Not Found',
      total_profit_loss: 0
    }
  }));
  
  return { history: historyWithSessions, error: null };
}