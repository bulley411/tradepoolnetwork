'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_FALLBACK = 1350;

interface ExchangeRateConfig {
  rate: number;
  manual_fallback_rate: number;
  use_fallback_only: boolean;
}

async function getExchangeRateConfig(): Promise<ExchangeRateConfig> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate, manual_fallback_rate, use_fallback_only')
    .eq('from_currency', 'USD')
    .eq('to_currency', 'NGN')
    .single();
  
  return {
    rate: data?.rate || DEFAULT_FALLBACK,
    manual_fallback_rate: data?.manual_fallback_rate || DEFAULT_FALLBACK,
    use_fallback_only: data?.use_fallback_only || false,
  };
}

export async function getUSDToNGNRate(): Promise<number> {
  const config = await getExchangeRateConfig();
  
  // If admin wants to use fallback only (manual rate)
  if (config.use_fallback_only) {
    return config.manual_fallback_rate;
  }
  
  // Check memory cache
  if (cachedRate && (Date.now() - cachedRate.timestamp) < CACHE_DURATION_MS) {
    return cachedRate.rate;
  }
  
  // Try external APIs
  const sources = [
    fetchFromBudjet,
    fetchFromExchangeRateHost,
  ];
  
  for (const source of sources) {
    try {
      const rate = await source();
      if (rate && rate > 0) {
        cachedRate = { rate, timestamp: Date.now() };
        return rate;
      }
    } catch (error) {
      console.error('Exchange rate source failed:', error);
      continue;
    }
  }
  
  // Fallback to manual fallback rate set by admin
  console.warn('All exchange rate APIs failed, using manual fallback rate');
  return config.manual_fallback_rate;
}

async function fetchFromBudjet(): Promise<number | null> {
  try {
    const response = await fetch('https://api.budjet.org/fiat/USD/NGN', {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.USD?.NGN || null;
  } catch {
    return null;
  }
}

async function fetchFromExchangeRateHost(): Promise<number | null> {
  try {
    const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN', {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.rates?.NGN || null;
  } catch {
    return null;
  }
}

export async function convertUSDtoNGN(usdAmount: number): Promise<number> {
  const rate = await getUSDToNGNRate();
  return usdAmount * rate;
}

export async function updateExchangeRate(
  rate: number, 
  adminId: string, 
  useFallbackOnly?: boolean,
  manualFallbackRate?: number
): Promise<void> {
  const supabase = createAdminClient();
  
  const updateData: any = {
    updated_at: new Date().toISOString(),
    updated_by: adminId,
  };
  
  if (rate) {
    updateData.rate = rate;
  }
  
  if (manualFallbackRate !== undefined) {
    updateData.manual_fallback_rate = manualFallbackRate;
  }
  
  if (useFallbackOnly !== undefined) {
    updateData.use_fallback_only = useFallbackOnly;
  }
  
  await supabase
    .from('exchange_rates')
    .upsert({
      from_currency: 'USD',
      to_currency: 'NGN',
      ...updateData,
    }, {
      onConflict: 'from_currency,to_currency',
    });
  
  // Clear cache
  cachedRate = null;
}

export async function getExchangeRateStatus(): Promise<{
  currentRate: number;
  fallbackRate: number;
  useFallbackOnly: boolean;
  lastUpdated: string | null;
}> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate, manual_fallback_rate, use_fallback_only, updated_at')
    .eq('from_currency', 'USD')
    .eq('to_currency', 'NGN')
    .single();
  
  return {
    currentRate: data?.rate || DEFAULT_FALLBACK,
    fallbackRate: data?.manual_fallback_rate || DEFAULT_FALLBACK,
    useFallbackOnly: data?.use_fallback_only || false,
    lastUpdated: data?.updated_at || null,
  };
}