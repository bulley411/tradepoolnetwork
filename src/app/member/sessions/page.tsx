'use client';

import { useState, useEffect } from 'react';
import { getOpenSessions, commitToSession } from '@/services/session-service';

interface Session {
  id: string;
  title: string;
  description: string | null;
  asset_class: string;
  min_commitment: number;
  max_commitment: number | null;
  total_committed: number;
  user_committed_amount: number;
  opened_for_commitments_at: string;
}

export default function MemberSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    const result = await getOpenSessions();
    if (result.error) {
      setError(result.error);
    } else {
      setSessions(result.sessions);
      setAvailableBalance(result.availableBalance);
    }
    setLoading(false);
  }

  async function handleCommit(sessionId: string, formData: FormData) {
    setCommitting(sessionId);
    setError(null);
    setSuccess(null);
    
    const result = await commitToSession(formData);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Successfully committed to session!');
      loadSessions();
    }
    
    setCommitting(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Available Trading Sessions</h1>
        <p className="text-gray-600 mt-1">
          Available Balance: <span className="font-bold text-green-600">${availableBalance.toFixed(2)}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No open sessions available at this time.</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for new trading opportunities.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{session.title}</h2>
                  <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 mt-2">
                    {session.asset_class?.toUpperCase() || 'CRYPTO'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Pool</div>
                  <div className="font-bold text-lg">${session.total_committed?.toFixed(2) || '0'}</div>
                </div>
              </div>

              {session.description && (
                <p className="text-gray-600 text-sm mb-4">{session.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Min Commitment:</span>
                  <span className="ml-2 font-medium">${session.min_commitment}</span>
                </div>
                <div>
                  <span className="text-gray-500">Max Commitment:</span>
                  <span className="ml-2 font-medium">
                    {session.max_commitment ? `$${session.max_commitment}` : 'No limit'}
                  </span>
                </div>
              </div>

              {session.user_committed_amount > 0 && (
                <div className="mb-4 p-2 bg-blue-50 rounded text-sm">
                  <span className="text-blue-700">You've committed: ${session.user_committed_amount.toFixed(2)}</span>
                </div>
              )}

              <form action={(formData) => handleCommit(session.id, formData)}>
                <input type="hidden" name="session_id" value={session.id} />
                <div className="flex gap-3">
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount (USDT)"
                    step="1"
                    min={session.min_commitment}
                    max={session.max_commitment || undefined}
                    required
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={committing === session.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {committing === session.id ? 'Processing...' : 'Commit'}
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Funds will be locked until session ends
                </div>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}