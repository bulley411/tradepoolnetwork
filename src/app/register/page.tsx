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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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
    
    if (!acceptedTerms) {
      setError('You must accept the Terms & Conditions');
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
          accepted_terms_at: new Date().toISOString(),
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
        
        {/* Terms and Conditions Checkbox */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{' '}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-blue-600 hover:underline"
            >
              Terms & Conditions
            </button>
          </label>
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

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <TermsModal onClose={() => setShowTerms(false)} />
      )}
    </div>
  );
}

// Terms and Conditions Modal Component
function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Terms & Conditions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4 text-sm text-gray-700">
          <h3 className="font-bold text-base">1. Introduction</h3>
          <p>Welcome to TradePoolNetwork ("Platform", "we", "our", "us"). By registering and using our platform, you agree to these Terms & Conditions.</p>
          
          <h3 className="font-bold text-base">2. Investment & Trading Policy</h3>
          <p>TradePoolNetwork operates on a <strong>spot trading only</strong> basis. We do not engage in:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Futures trading</li>
            <li>Options trading</li>
            <li>Leveraged trading</li>
            <li>Margin trading</li>
            <li>Derivatives or perpetual contracts</li>
          </ul>
          <p className="mt-2">All trades are executed as spot transactions on major cryptocurrency exchanges.</p>
          
          <h3 className="font-bold text-base">3. Risk Acknowledgment</h3>
          <p className="font-semibold text-red-700">IMPORTANT: Trading and investing involve significant risk of loss.</p>
          <p>You acknowledge and agree that:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Past performance does not guarantee future results</li>
            <li>You may lose part or all of your invested capital</li>
            <li>Market conditions are unpredictable and volatile</li>
            <li>TradePoolNetwork does not guarantee any returns or profits</li>
            <li>You are solely responsible for your investment decisions</li>
          </ul>
          
          <h3 className="font-bold text-base">4. Profit & Loss Sharing</h3>
          <p>Profits and losses from trading sessions are shared on a <strong>50/50 basis</strong> between members and the platform. The platform's share is used for operational costs, development, and referral commissions.</p>
          
          <h3 className="font-bold text-base">5. Referral Program</h3>
          <p>Referral commissions are paid exclusively from the platform's profit share. Commissions are calculated as 5% of the platform's share from referred users' trading activities.</p>
          
          <h3 className="font-bold text-base">6. Data Collection & Privacy</h3>
          <p>By registering, you consent to the collection and storage of the following personal information:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Bank account details (for withdrawals)</li>
            <li>Cryptocurrency wallet addresses</li>
            <li>Transaction history</li>
          </ul>
          <p>We use this information solely for:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Account management and verification</li>
            <li>Processing deposits and withdrawals</li>
            <li>Communicating important platform updates</li>
            <li>Complying with legal and regulatory requirements</li>
          </ul>
          <p>We do not sell or share your personal data with third parties except as required by law.</p>
          
          <h3 className="font-bold text-base">7. Deposit & Withdrawal Policy</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Minimum deposit: 5 USDT</li>
            <li>Withdrawals require 3 business days notice</li>
            <li>Withdrawal fees apply outside settlement periods</li>
            <li>During settlement periods (last 5 days of month), withdrawals are free</li>
          </ul>
          
          <h3 className="font-bold text-base">8. Session Participation</h3>
          <p>Members may commit funds to open trading sessions. Committed funds become locked until the session ends. Funds cannot be withdrawn while locked in an active session.</p>
          
          <h3 className="font-bold text-base">9. Account Responsibility</h3>
          <p>You are responsible for maintaining the security of your account credentials. TradePoolNetwork is not liable for unauthorized access resulting from compromised passwords or credentials.</p>
          
          <h3 className="font-bold text-base">10. Amendments</h3>
          <p>We reserve the right to modify these Terms & Conditions at any time. Continued use of the platform constitutes acceptance of updated terms.</p>
          
          <h3 className="font-bold text-base">11. Termination</h3>
          <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or misuse the platform.</p>
          
          <h3 className="font-bold text-base">12. Governing Law</h3>
          <p>These terms are governed by the laws of Nigeria. Any disputes shall be resolved through binding arbitration.</p>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
            <p className="font-semibold">By checking the "I agree to the Terms & Conditions" box, you acknowledge that:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>You have read and understood these terms</li>
              <li>You accept the risks associated with trading</li>
              <li>You consent to the collection of your personal data</li>
              <li>You are at least 18 years old</li>
            </ul>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
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