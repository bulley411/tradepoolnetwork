'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Commission {
  id: string;
  commission_amount: number;
  created_at: string;
  user_id: string;
  trader_email?: string;
}

interface Profile {
  referral_code: string;
  referred_by: string | null;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referredCount, setReferredCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  async function loadReferralData() {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Get user's profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('referral_code, referred_by')
      .eq('id', user.id)
      .single();
    
    setProfile(profileData);
    
    // Get referral commissions earned (without nested select)
    const { data: commissionsData } = await supabase
      .from('referral_commissions')
      .select('id, commission_amount, created_at, user_id')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (commissionsData) {
      // Get trader emails separately
      const userIds = commissionsData.map(c => c.user_id);
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        
        const emailMap = new Map();
        profiles?.forEach(p => {
          emailMap.set(p.id, p.email);
        });
        
        const commissionsWithEmail = commissionsData.map(c => ({
          ...c,
          trader_email: emailMap.get(c.user_id) || 'Unknown'
        }));
        
        setCommissions(commissionsWithEmail);
        const total = commissionsWithEmail.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        setTotalEarnings(total);
      } else {
        setCommissions(commissionsData);
        const total = commissionsData.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        setTotalEarnings(total);
      }
    }
    
    // Get number of people referred
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', user.id);
    
    setReferredCount(count || 0);
    setLoading(false);
  }

  async function copyReferralLink() {
    const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code}`;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code || ''}`;

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Referral Program</h1>
      <p className="text-gray-600 mb-6">Earn 5% of platform share from traders you refer</p>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="border rounded-lg p-5">
          <h3 className="text-sm text-gray-500">Your Referral Code</h3>
          <p className="text-2xl font-mono font-bold mt-1">{profile?.referral_code}</p>
        </div>
        <div className="border rounded-lg p-5">
          <h3 className="text-sm text-gray-500">People Referred</h3>
          <p className="text-2xl font-bold mt-1">{referredCount}</p>
        </div>
        <div className="border rounded-lg p-5">
          <h3 className="text-sm text-gray-500">Total Referral Earnings</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Referral Link */}
      <div className="border rounded-lg p-5 mb-8">
        <h3 className="font-semibold mb-2">Your Referral Link</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      
      {/* Commission History */}
      {commissions.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="border-b px-5 py-3 bg-gray-50">
            <h3 className="font-semibold">Commission History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-left p-3 text-sm">Trader</th>
                  <th className="text-right p-3 text-sm">Commission</th>
                  <th className="text-left p-3 text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((commission) => (
                  <tr key={commission.id} className="border-t">
                    <td className="p-3">
                      {commission.trader_email || 'Unknown'}
                    </td>
                    <td className="p-3 text-right text-green-600 font-medium">
                      ${(commission.commission_amount || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(commission.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No referral commissions yet</p>
          <p className="text-sm text-gray-400 mt-1">Share your link and earn when they trade</p>
        </div>
      )}
    </div>
  );
}