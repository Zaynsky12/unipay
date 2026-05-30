import { NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { GraphQLClient, gql } from 'graphql-request';
import { LUMIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';

// ── Arc Testnet Chain ──────────────────────────────────────────────────────────
const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

// ── Goldsky Query: Get all active subscriptions ────────────────────────────────
const GET_ACTIVE_SUBSCRIPTIONS = gql`
  query GetActiveSubscriptions($first: Int = 100, $skip: Int = 0) {
    subscriptionPlans(
      where: { isActive: true }
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: asc
    ) {
      id
      subscriber
      merchant { id }
      amount
      token
      interval
    }
  }
`;

/**
 * POST /api/cron/subscriptions
 * 
 * Automated relayer that executes due subscription payments.
 * Protected by CRON_SECRET — only Vercel Cron or authorized callers can trigger.
 * 
 * Flow:
 * 1. Query Goldsky for all active subscriptions
 * 2. For each, read on-chain state to check if payment is due
 * 3. Call executeSubscription() for due subscriptions
 */
export async function GET(req: Request) {
  // ── Auth: verify cron secret ───────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Setup: wallet & clients ────────────────────────────────────────────────
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ error: 'PRIVATE_KEY not configured' }, { status: 500 });
  }

  const goldskyUrl = process.env.NEXT_PUBLIC_GOLDSKY_URL;
  if (!goldskyUrl) {
    return NextResponse.json({ error: 'GOLDSKY_URL not configured' }, { status: 500 });
  }

  const pKey = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;
  const account = privateKeyToAccount(pKey);

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  });

  const goldskyClient = new GraphQLClient(goldskyUrl);

  const results: { subId: string; status: string; txHash?: string; error?: string }[] = [];

  try {
    // ── Step 1: Get all active subscriptions from Goldsky ──────────────────
    const data: any = await goldskyClient.request(GET_ACTIVE_SUBSCRIPTIONS);
    const activeSubs = data?.subscriptionPlans || [];

    if (activeSubs.length === 0) {
      return NextResponse.json({
        message: 'No active subscriptions found',
        timestamp: new Date().toISOString(),
        processed: 0,
      });
    }

    // ── Step 2: Check each subscription on-chain & execute if due ──────────
    const now = BigInt(Math.floor(Date.now() / 1000));

    for (const sub of activeSubs) {
      const subId = sub.id as `0x${string}`;

      try {
        // Read on-chain subscription state
        const onchainSub = await publicClient.readContract({
          address: LUMIPAY_REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'subscriptions',
          args: [subId],
        }) as any;

        const isActive = onchainSub[6]; // isActive
        const nextPaymentDue = onchainSub[5] as bigint; // nextPaymentDue

        if (!isActive) {
          results.push({ subId, status: 'skipped', error: 'Inactive on-chain' });
          continue;
        }

        if (now < nextPaymentDue) {
          results.push({ subId, status: 'skipped', error: `Not due yet (due: ${nextPaymentDue.toString()})` });
          continue;
        }

        // ── Execute the subscription payment ─────────────────────────────
        const txHash = await walletClient.writeContract({
          address: LUMIPAY_REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'executeSubscription',
          args: [subId],
        });

        // Wait for confirmation (Arc has sub-second finality)
        await publicClient.waitForTransactionReceipt({ hash: txHash });

        results.push({ subId, status: 'executed', txHash });

      } catch (err: any) {
        // Common failures: insufficient allowance/balance from subscriber
        results.push({
          subId,
          status: 'failed',
          error: err.shortMessage || err.message || 'Unknown error',
        });
      }
    }

    const executed = results.filter(r => r.status === 'executed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    return NextResponse.json({
      message: `Processed ${activeSubs.length} subscriptions`,
      timestamp: new Date().toISOString(),
      summary: { executed, failed, skipped, total: activeSubs.length },
      results,
    });

  } catch (err: any) {
    return NextResponse.json({
      error: 'Relayer execution failed',
      details: err.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
