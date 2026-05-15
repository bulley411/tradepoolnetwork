'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referralCode = searchParams.get('ref');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    
    if (!phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    const supabase = createClient();
    
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          referral_code: referralCode || null,
        }
      }
    });
    
    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
    
    setLoading(false);
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
          <p className="font-medium">Registration successful!</p>
          <p className="text-sm mt-1">Please check your email to confirm your account.</p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-2">Create Account</h1>
      <p className="text-gray-600 mb-6">Join TradePoolNetwork</p>
      
      {referralCode && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg mb-4 text-sm">
          ✓ Referred by: <span className="font-mono">{referralCode}</span>
        </div>
      )}
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <input
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number *</label>
          <input
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password *</label>
          <input
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password *</label>
          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      
      <p className="text-center text-sm text-gray-600 mt-6">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          Login
        </a>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}