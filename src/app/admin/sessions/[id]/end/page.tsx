'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { endTradingAndDistribute } from '@/features/admin/actions';

interface Session {
  id: string;
  title: string;
  total_committed: number;
  status: string;
}

interface Commitment {
  id: string;
  user_id: string;
  amount: number;
  contribution_pct: number;
  profile: {
    full_name: string | null;
    email: string;
  };
}

export default function EndTradingPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profitLoss, setProfitLoss] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionData();
  }, []);

  async function loadSessionData() {
  const supabase = createClient();
  
  // Get session
  const { data: sessionData } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  console.log('Session data:', sessionData);
  setSession(sessionData);
  
  // Get commitments with profiles (note: profiles returns an array)
  const { data: commitmentsData } = await supabase
    .from('session_commitments')
    .select(`
      id,
      user_id,
      amount,
      contribution_pct,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .eq('session_id', sessionId)
    .eq('status', 'active');
  
  console.log('Commitments raw:', commitmentsData);
  
  if (commitmentsData && commitmentsData.length > 0) {
    // Fix: profiles is an array, take the first item
    const formattedCommitments = commitmentsData.map(c => ({
      id: c.id,
      user_id: c.user_id,
      amount: c.amount,
      contribution_pct: c.contribution_pct || 0,
      profile: Array.isArray(c.profiles) && c.profiles.length > 0 
        ? c.profiles[0] 
        : { full_name: null, email: 'Unknown' }
    }));
    
    console.log('Formatted commitments:', formattedCommitments);
    setCommitments(formattedCommitments);
  }
  
  setLoading(false);
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    const total = parseFloat(profitLoss);
    if (isNaN(total)) {
      setError('Please enter a valid number');
      setSubmitting(false);
      return;
    }
    
    const result = await endTradingAndDistribute(sessionId, total);
    
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.push('/admin/sessions');
    }
  }

  // Calculate preview distributions
  const platformSplit = 0.5;
  const profitLossNumber = parseFloat(profitLoss) || 0;
  
  const previewDistributions = useMemo(() => {
    if (!commitments.length || profitLossNumber === 0) {
      return [];
    }
    
    console.log('Calculating for profitLoss:', profitLossNumber);
    
    return commitments.map(c => {
      const userShareOfPool = (c.contribution_pct || 0) / 100;
      const grossPnlShare = profitLossNumber * userShareOfPool;
      const platformCut = grossPnlShare * platformSplit;
      const netPayout = grossPnlShare - platformCut;
      
      console.log(`User ${c.profile?.email}: pct=${c.contribution_pct}, share=${userShareOfPool}, gross=${grossPnlShare}, net=${netPayout}`);
      
      return {
        name: c.profile?.full_name || c.profile?.email || 'Unknown',
        amount: c.amount,
        pct: c.contribution_pct || 0,
        grossShare: grossPnlShare,
        platformCut: platformCut,
        netPayout: netPayout,
      };
    });
  }, [commitments, profitLossNumber]);

  const totalGross = previewDistributions.reduce((sum, d) => sum + d.grossShare, 0);
  const totalPlatform = previewDistributions.reduce((sum, d) => sum + d.platformCut, 0);
  const totalNet = previewDistributions.reduce((sum, d) => sum + d.netPayout, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading session data...</div>
      </div>
    );
  }

  if (!session || session.status !== 'trading') {
    return (
      <div className="py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          This session is not in trading status. Current status: {session?.status}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">End Trading Session</h1>
      <p className="text-gray-600 mb-6">
        {session.title} — Total Pool: <span className="font-bold">${session.total_committed?.toFixed(2)}</span>
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <label className="block text-sm font-medium mb-1">
            Total Profit / Loss for this Session
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl">$</span>
            <input
              type="number"
              value={profitLoss}
              onChange={(e) => setProfitLoss(e.target.value)}
              step="any"
              placeholder="0.00"
              required
              className="flex-1 px-3 py-2 border rounded-lg text-lg"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Positive number = profit. Negative number = loss.
          </p>
        </div>
        
        {/* Show debug info */}
        <div className="text-xs text-gray-400">
          Debug: Profit = {profitLossNumber}, Commitments = {commitments.length}, 
          First PCT = {commitments[0]?.contribution_pct}
        </div>
        
        {previewDistributions.length > 0 && profitLossNumber !== 0 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="font-semibold mb-3">Distribution Preview (50/50 Split)</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Member</th>
                    <th className="text-right p-2">Committed</th>
                    <th className="text-right p-2">% of Pool</th>
                    <th className="text-right p-2">Gross Share</th>
                    <th className="text-right p-2">Platform (50%)</th>
                    <th className="text-right p-2">Member Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {previewDistributions.map((d, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{d.name}</td>
                      <td className="text-right p-2">${d.amount.toFixed(2)}</td>
                      <td className="text-right p-2">{d.pct.toFixed(2)}%</td>
                      <td className={`text-right p-2 ${d.grossShare >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${d.grossShare.toFixed(2)}
                      </td>
                      <td className="text-right p-2">${d.platformCut.toFixed(2)}</td>
                      <td className={`text-right p-2 font-medium ${d.netPayout >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${d.netPayout.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="border-t font-semibold">
                    <td className="p-2">TOTAL</td>
                    <td className="text-right p-2">${session.total_committed?.toFixed(2)}</td>
                    <td className="text-right p-2">100%</td>
                    <td className="text-right p-2">${totalGross.toFixed(2)}</td>
                    <td className="text-right p-2">${totalPlatform.toFixed(2)}</td>
                    <td className="text-right p-2">${totalNet.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !profitLoss}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Confirm & Distribute'}
          </button>
        </div>
      </form>
    </div>
  );
}