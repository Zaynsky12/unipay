import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'transactions.json');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  let transactions = [];
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      if (data) {
        transactions = JSON.parse(data);
      }
    }
  } catch (e) {
    console.error("Error reading db", e);
    // Return empty list instead of crashing
    return NextResponse.json({ success: true, history: [] });
  }

  if (!Array.isArray(transactions)) {
    console.error("Transactions data is not an array");
    return NextResponse.json({ success: true, history: [] });
  }

  const userHistory = transactions.filter((tx: any) => 
    tx.userAddress && tx.userAddress.toLowerCase() === address.toLowerCase()
  );

  // Sort by timestamp descending
  userHistory.sort((a: any, b: any) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return dateB - dateA;
  });

  return NextResponse.json({ 
    success: true, 
    history: userHistory 
  });
}
