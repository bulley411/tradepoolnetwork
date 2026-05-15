'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/features/admin/actions';

export default function NewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const result = await createSession(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/admin/sessions');
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Trading Session</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            name="title"
            required
            className="w-full px-3 py-2 border rounded-lg bg-background"
            placeholder="e.g., BTC/USDT Spot Trading - May 2026"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg bg-background"
            placeholder="Describe the trading strategy, risk level, etc."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Asset Class</label>
          <select
            name="asset_class"
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            <option value="crypto">Crypto</option>
            <option value="forex">Forex</option>
            <option value="real_estate">Real Estate</option>
            <option value="agriculture">Agriculture</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Commitment (USDT)</label>
            <input
              type="number"
              name="min_commitment"
              defaultValue="5"
              step="1"
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Max Commitment (USDT)</label>
            <input
              type="number"
              name="max_commitment"
              placeholder="No limit"
              step="10"
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
}