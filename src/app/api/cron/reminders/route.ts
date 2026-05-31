import { NextResponse } from 'next/server';
import { goldskyClient, GET_ACTIVE_SUBSCRIPTIONS } from '@/lib/goldsky';
import { createPublicClient, http, formatUnits } from 'viem';
import { LUMIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';
import { defineChain } from 'viem';
import { PrivyClient } from '@privy-io/server-auth';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  process.env.PRIVY_APP_SECRET || ''
);

const resend = new Resend(process.env.RESEND_API_KEY || '');

// Duplicate chain definition here to avoid circular client component imports if any
const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public:  { http: ['https://rpc.testnet.arc.network'] },
  },
});

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http()
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isTest = url.searchParams.get('test') === 'true';

    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    // In test mode, we bypass auth if running locally, otherwise require it.
    if (!isTest && process.env.CRON_SECRET && authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch active subscriptions from Goldsky
    const data: any = await goldskyClient.request(GET_ACTIVE_SUBSCRIPTIONS);
    const activeSubs = data.subscriptionPlans || [];

    if (activeSubs.length === 0) {
      return NextResponse.json({ message: 'No active subscriptions found' });
    }

    const emailsSent = [];

    // 2. Iterate through subscriptions and check exact nextPaymentDue on-chain
    for (const sub of activeSubs) {
      try {
        const subData = await publicClient.readContract({
          address: LUMIPAY_REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'subscriptions',
          args: [sub.id as `0x${string}`]
        }) as any;

        const nextPaymentDue = Number(subData[5]); // index 5 is nextPaymentDue
        const isActiveOnChain = Boolean(subData[6]); // index 6 is isActive

        if (!isActiveOnChain || nextPaymentDue === 0) continue;

        const intervalDays = Number(sub.interval) / 86400;
        const now = Math.floor(Date.now() / 1000);
        const daysRemaining = Math.floor((nextPaymentDue - now) / 86400);

        // 3. Dynamic Reminder Logic
        let shouldRemind = false;
        
        if (isTest) {
          shouldRemind = true; // Force remind in test mode
        } else if (intervalDays >= 30 && daysRemaining === 3) {
          shouldRemind = true;
        } else if (intervalDays >= 7 && intervalDays < 30 && daysRemaining === 2) {
          shouldRemind = true;
        } else if (intervalDays < 7 && daysRemaining === 1) {
          shouldRemind = true;
        }

        if (shouldRemind) {
          // 4. Get User Email from Privy
          const user = await privy.getUserByWalletAddress(sub.subscriber.toLowerCase());
          const emailAccount = user?.linkedAccounts.find((a: any) => a.type === 'email');
          
          if (emailAccount && 'address' in emailAccount) {
            const email = (emailAccount as any).address;
            const amountFormatted = formatUnits(BigInt(sub.amount), 6);
            const merchantName = sub.merchant.name;

            // 5. Send Email via Resend
            await resend.emails.send({
              from: 'LumiPay Reminders <onboarding@resend.dev>',
              to: email,
              subject: `Reminder: Subscription Due Soon for ${merchantName}`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 16px;">
                  <h2 style="color: #fc5000; margin-top: 0;">LumiPay Subscription Reminder</h2>
                  <p style="color: #333; font-size: 16px;">Hi there,</p>
                  <p style="color: #333; font-size: 16px; line-height: 1.5;">This is a friendly reminder that your subscription to <strong>${merchantName}</strong> for <strong>$${amountFormatted} ${sub.token || 'USDC'}</strong> is due in <strong>${daysRemaining > 0 ? daysRemaining : 0} day(s)</strong>.</p>
                  <p style="color: #333; font-size: 16px; line-height: 1.5;">Since LumiPay uses a secure, non-custodial manual push system, we do not auto-charge your wallet. To avoid service interruption, please visit your dashboard to manually renew your subscription.</p>
                  <a href="https://lumipay.xyz/dashboard/account" style="display: inline-block; padding: 14px 28px; background-color: #fc5000; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 24px; font-size: 16px;">Renew Subscription Now</a>
                </div>
              `
            });
            
            emailsSent.push({ subId: sub.id, email, daysRemaining });
          }
        }
      } catch (err) {
        console.error(`Error processing sub ${sub.id}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: activeSubs.length,
      emailsSentCount: emailsSent.length,
      emailsSent
    });
  } catch (error: any) {
    console.error('Reminder Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
