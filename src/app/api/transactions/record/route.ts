import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userAddress, type, amount, txHash } = body;

    if (!userAddress || !type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // MOCK: In a real app, you would save this to Supabase/PostgreSQL
    console.log('Recording transaction:', {
      userAddress,
      type,
      amount,
      txHash,
      timestamp: new RegExp(new Date().toISOString())
    });

    // Simulate successful storage
    return NextResponse.json({ 
      success: true, 
      message: 'Transaction recorded successfully',
      data: { userAddress, type, amount, txHash }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
