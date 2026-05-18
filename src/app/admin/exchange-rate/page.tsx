'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getExchangeRateStatus, updateExchangeRate } from '@/services/exchange-rate-service';

export default function AdminExchangeRatePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentRate, setCurrentRate] = useState(1500);
  const [fallbackRate, setFallbackRate] = useState(1500);
  const [useFallbackOnly, setUseFallbackOnly] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const status = await getExchangeRateStatus();
    setCurrentRate(status.currentRate);
    setFallbackRate(status.fallbackRate);
    setUseFallbackOnly(status.useFallbackOnly);
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
    
    try {
      await updateExchangeRate(
        currentRate,
        user.id,
        useFallbackOnly,
        fallbackRate
      );
      setMessage({ type: 'success', text: 'Exchange rate settings saved successfully!' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    }
    
    setSaving(false);
  }

  async function testAPI() {
    setMessage(null);
    try {
      const response = await fetch('/api/exchange-rate');
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `API is working. Current rate: 1 USD = ₦${data.rate}` });
      } else {
        setMessage({ type: 'error', text: 'API failed. Using fallback rate.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Cannot connect to exchange rate API' });
    }
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
      <h1 className="text-2xl font-bold mb-2">Exchange Rate Management</h1>
      <p className="text-gray-600 mb-6">USD to Nigerian Naira (NGN)</p>
      
      <form onSubmit={handleSave} className="space-y-6">
        {/* Live Rate Settings */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Live Exchange Rate</h2>
          <p className="text-sm text-gray-500 mb-4">
            This rate is fetched from external APIs (Budjet.org, ExchangeRate.host)
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Current Live Rate</label>
            <input
              type="number"
              step="0.01"
              value={currentRate}
              onChange={(e) => setCurrentRate(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              This rate will be used when external APIs are working
            </p>
          </div>
        </div>
        
        {/* Fallback Rate Settings */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Manual Fallback Rate</h2>
          <p className="text-sm text-gray-500 mb-4">
            This rate is used when external APIs are unavailable
          </p>
          
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useFallbackOnly}
                onChange={(e) => setUseFallbackOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Use fallback rate only (ignore external APIs)</span>
            </label>
            <p className="text-xs text-gray-400 mt-1 ml-6">
              Enable this to always use the manual rate instead of fetching from APIs
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Manual Fallback Rate</label>
            <input
              type="number"
              step="0.01"
              value={fallbackRate}
              onChange={(e) => setFallbackRate(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Rate used when APIs fail or when "Use fallback only" is enabled
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={testAPI}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Test API Connection
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
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
      </form>
      
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">How It Works</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>System first checks if "Use fallback only" is enabled</li>
          <li>If not, it tries to fetch from external APIs</li>
          <li>If APIs fail, it uses the Manual Fallback Rate</li>
          <li>If Manual Fallback Rate is not set, it uses default ₦1,350</li>
        </ol>
      </div>
    </div>
  );
}