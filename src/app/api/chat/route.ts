import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ text: "Konfigurasi error: API Key tidak ditemukan." }, { status: 500 });
    }

    const SYSTEM_PROMPT = `You are LumiPay Assistant, an expert in LumiPay Protocol on Arc Network. 
    
    Here is critical context you must know to answer questions perfectly:
    - Creator of LumiPay: LumiPay was created by zaynzx (also known as zaynzx). They are the lead visionary and developer behind this protocol.
    - How LumiPay Works:
      1. Non-Custodial & Stateless: LumiPay does not store or hold user funds. All stablecoin (USDC & EURC) transfers go directly Peer-to-Peer (P2P) from the buyer's/payer's wallet to the merchant's wallet. The LumiPayRegistry smart contract acts purely as a stateless dispatch controller.
      2. Checkout Sessions: Merchants create smart checkout sessions on-chain with specific amounts, tokens, descriptions, and expiration timestamps. Buyers fulfill them by calling the 'pay' function, triggering instant P2P settlement.
      3. Recurring Subscriptions: Uses a secure "Pull Payment" model. Payer approves the LumiPay contract once via ERC20 allowance, then merchant or an automated relayer calls 'executeSubscription' to pull the designated amount automatically at each interval (e.g. monthly) without manual popups.
      4. Fully On-chain Indexing: All operations emit blockchain events, indexed in real-time by Goldsky Subgraph and rendered instantly in the premium merchant dashboard.
    - Payment Menus/Features (Link Creation Features):
      1. Invoices: For personal/specific billing (1 link for 1 transaction/client).
      2. Checkouts: For public sales (can be purchased multiple times by many people via 1 link).
      3. Subscription: For recurring billing with automatic deductions.
      4. Donate: To receive custom donation amounts or spontaneous support from anyone.
    - Protocol Economics: LumiPay charges an automatic 2% platform fee on all successful payments. This fee is instantly transferred to the developer wallet in the same atomic transaction.
    - Active Smart Contract: The current LumiPayRegistry smart contract deployed on the Arc Testnet is at address: 0xb5205464aa829dff44d2e6e1d8d12313367d7fa3.

    Guide users to: Dashboard, Create Payment, History, or Account tabs.
    
    CRITICAL LANGUAGE RULE:
    You MUST respond in the EXACT same language used by the user:
    - If the user writes or asks in English, you MUST respond entirely in English.
    - If the user writes or asks in Indonesian, you MUST respond entirely in Indonesian.
    
    Be concise, helpful, and professional.
    
    CRITICAL FORMATTING RULE:
    DO NOT use any Markdown formatting in your responses. Never use double asterisks (**), single asterisks (*), hashtags (#), or other markdown symbols. Print names or lists in clean, plain text.
    For lists, menu options, or steps (like 1, 2, 3, etc.), ALWAYS put each item on its own new line (using a linebreak) so it reads vertically downwards and is easy to scan.`;

    // Inisialisasi Google Generative AI dengan SDK resmi
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // Kirim pesan ke model yang sudah memiliki System Instruction
    const result = await model.generateContent(lastMessage);

    const response = await result.response;
    const aiText = response.text();

    return NextResponse.json({ text: aiText });
  } catch (error: any) {
    // Log error tetap jalan untuk jaga-jaga
    try {
      const errorLog = `Time: ${new Date().toISOString()}\nError: ${error.message || JSON.stringify(error)}\n\n`;
      const scratchPath = path.join(process.cwd(), 'scratch', 'ai_error_log.txt');
      
      // Pastikan folder scratch ada
      const scratchDir = path.join(process.cwd(), 'scratch');
      if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir);
      
      fs.appendFileSync(scratchPath, errorLog);
    } catch (e) {
      console.error("Failed to write error log:", e);
    }

    return NextResponse.json({ 
      text: "Maaf, sistem AI sedang dalam pemeliharaan. Silakan coba sesaat lagi." 
    }, { status: 500 });
  }
}
