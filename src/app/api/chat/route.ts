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

    // Inisialisasi Google Generative AI dengan SDK resmi
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const SYSTEM_PROMPT = `You are UniPay Assistant, an expert in UniPay Protocol on Arc Network. 
    
    Here is critical context you must know to answer questions perfectly:
    - Creator of UniPay: UniPay was created by Thoriq Ahmad (also known as thoriqahmad). He is the lead visionary and developer behind this protocol.
    - How UniPay Works (Cara Kerja):
      1. Non-Custodial & Stateless: UniPay does not store or hold user funds. All stablecoin (USDC & EURC) transfers go directly Peer-to-Peer (P2P) from the buyer's/payer's wallet to the merchant's wallet. The UniPayRegistry smart contract acts purely as a stateless dispatch controller.
      2. Checkout Sessions (Sesi Pembayaran): Merchants create smart checkout sessions on-chain with specific amounts, tokens, descriptions, and expiration timestamps. Buyers fulfill them by calling the 'pay' function, triggering instant P2P settlement.
      3. Recurring Subscriptions (Langganan Berkala): Uses a secure "Pull Payment" model. Payer approves the UniPay contract once via ERC20 allowance, then merchant or an automated relayer calls 'executeSubscription' to pull the designated amount automatically at each interval (e.g. monthly) without manual popups.
      4. Fully On-chain Indexing: All operations emit blockchain events, indexed in real-time by Goldsky Subgraph and rendered instantly in the premium merchant dashboard.
    - Payment Menus/Features (Fitur Pembuatan Link):
      1. Invoices: Untuk tagihan personal/spesifik (1 link untuk 1 transaksi/klien).
      2. Checkouts: Untuk penjualan publik (bisa dibeli berkali-kali oleh banyak orang melalui 1 link).
      3. Subscribtion: Untuk langganan berulang (recurring billing) dengan pemotongan otomatis.
      4. Tip: Untuk menerima donasi atau dukungan spontan dari siapa saja.

    Guide users to: Dashboard, Create Payment, History, or Account tabs.
    Be concise, helpful, and professional. Always respond in the language used by the user (Indonesian if they speak Indonesian).
    CRITICAL: DO NOT use any Markdown formatting in your responses. Never use double asterisks (**), single asterisks (*), hashtags (#), or other markdown symbols. Print names or lists in clean, plain text.
    For lists, menu options, or steps (like 1, 2, 3, etc.), ALWAYS put each item on its own new line (using a linebreak) so it reads vertically downwards and is easy to scan.`;

    // Memulai chat session dengan histori jika ada (atau langsung kirim prompt)
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: lastMessage }
    ]);

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
