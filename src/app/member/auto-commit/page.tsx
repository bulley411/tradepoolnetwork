'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AutoCommitSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [percentage, setPercentage] = useState(100);
  const [maxAmount, setMaxAmount] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('auto_commit_enabled, auto_commit_percentage, auto_commit_max_amount')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      setEnabled(profile.auto_commit_enabled || false);
      setPercentage(profile.auto_commit_percentage || 100);
      setMaxAmount(profile.auto_commit_max_amount?.toString() || '');
    }
    
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setMessage({ type: 'error', text: 'Not authenticated' });
      setSaving(false);
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        auto_commit_enabled: enabled,
        auto_commit_percentage: percentage,
        auto_commit_max_amount: maxAmount ? parseFloat(maxAmount) : null,
      })
      .eq('id', user.id);
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Auto-commit settings saved successfully!' });
    }
    
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Auto-Commit Settings</h1>
      <p className="text-gray-600 mb-6">Automatically commit funds to new trading sessions</p>
      
      <form onSubmit={handleSave} className="space-y-6">
        {/* Enable Auto-Commit */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">🤖 Auto-Commit</h2>
              <p className="text-sm text-gray-500">
                Automatically commit your available balance to new trading sessions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {enabled && (
            <div className="space-y-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Commitment Percentage (% of available balance)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={percentage}
                    onChange={(e) => setPercentage(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-16 text-center font-medium">{percentage}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Percentage of your available balance to commit to each session
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Maximum Commitment Amount (Optional)
                </label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum amount to commit per session (leave empty for no limit)
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">How Auto-Commit Works</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>When admin creates a new session, your available balance will be automatically committed</li>
            <li>Commitment amount = Available Balance × (Percentage / 100)</li>
            <li>If Max Amount is set, commitment will not exceed this limit</li>
            <li>You will still receive profit/loss based on your actual commitment amount</li>
            <li>You can always manually commit more or override auto-commit for any session</li>
            <li>You can disable auto-commit at any time</li>
          </ul>
        </div>
        
        {message && (
          <div className={`px-3 py-2 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}