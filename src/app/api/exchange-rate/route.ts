import { NextResponse } from 'next/server';
import { getUSDToNGNRate, getExchangeRateStatus } from '@/services/exchange-rate-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rate = await getUSDToNGNRate();
    const status = await getExchangeRateStatus();
    
    return NextResponse.json({
      success: true,
      rate,
      display: `1 USD = ₦${rate.toFixed(2)}`,
      currency: 'NGN',
      fallbackRate: status.fallbackRate,
      useFallbackOnly: status.useFallbackOnly,
      lastUpdated: status.lastUpdated,
    });
  } catch (error) {
    console.error('Exchange rate API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
}