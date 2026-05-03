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
      transactions = JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading db", e);
  }

  const userHistory = transactions.filter((tx: any) => tx.userAddress?.toLowerCase() === address.toLowerCase());

  // Sort by timestamp descending
  userHistory.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({ 
    success: true, 
    history: userHistory 
  });
}
