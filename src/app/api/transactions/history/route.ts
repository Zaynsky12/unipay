import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  // MOCK DATA: In a real app, this would be fetched from a database
  const mockHistory = [
    {
      id: '1',
      type: 'SHIELD',
      amount: '1000.00',
      token: 'USDC',
      txHash: '0x123...abc',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'COMPLETED'
    },
    {
      id: '2',
      type: 'SEND',
      amount: '250.00',
      token: 'USDC',
      txHash: '0x456...def',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'COMPLETED'
    }
  ];

  return NextResponse.json({ 
    success: true, 
    history: mockHistory 
  });
}
