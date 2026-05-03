import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'transactions.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userAddress, type, amount, token, txHash } = body;

    if (!userAddress || !type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTx = {
      id: Math.random().toString(36).substr(2, 9),
      userAddress,
      type,
      amount: amount.toString(), // Keep as string for consistency
      token: token || 'USDC',
      txHash,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    };

    let transactions = [];
    try {
      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf8');
        if (data) {
          transactions = JSON.parse(data);
        }
      }
    } catch (e) {
      console.error("Error reading database for record", e);
      transactions = [];
    }

    if (!Array.isArray(transactions)) {
      transactions = [];
    }

    transactions.push(newTx);
    fs.writeFileSync(dataPath, JSON.stringify(transactions, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction recorded successfully',
      data: newTx
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
