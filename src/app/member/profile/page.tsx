'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  referral_code: string;
  referred_by: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setProfile(profileData);
    setFullName(profileData?.full_name || '');
    setPhone(profileData?.phone || '');
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
        full_name: fullName,
        phone: phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      loadProfile(); // Reload
    }
    
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">My Profile</h1>
      <p className="text-gray-600 mb-6">View and update your personal information</p>
      
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="border-b px-6 py-4 bg-gray-50">
          <h2 className="font-semibold">Personal Information</h2>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="pt-2">
            <label className="block text-sm font-medium mb-1">Referral Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profile?.referral_code || ''}
                disabled
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(profile?.referral_code || '');
                  setMessage({ type: 'success', text: 'Referral code copied!' });
                  setTimeout(() => setMessage(null), 2000);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Share this code with friends to earn 5% commission</p>
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
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}