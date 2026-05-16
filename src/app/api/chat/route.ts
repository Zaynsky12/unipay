import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Mencoba mengambil API Key dari beberapa varian nama
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("AI Route Error: GEMINI_API_KEY is missing.");
      return NextResponse.json({ text: "Konfigurasi error: API Key tidak ditemukan di .env.local" }, { status: 500 });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const SYSTEM_PROMPT = `
You are UniPay Assistant, an expert AI specialized in the UniPay Protocol.
UniPay is a stateless payment protocol built on the Arc Network.

Key Knowledge Base:
1. MISSION: To provide non-custodial, deterministic billing and payment sessions.
2. CORE FEATURES: Paylinks, Subscriptions, Merchant Registry.
3. ARCHITECTURE: Stateless (Direct to wallet).
4. TOKENS: USDC, Native Arc assets.

INSTRUCTIONS:
- Guide users to: Dashboard, Create Payment, History, or Account tabs.
- Be concise and professional.
- NEVER give financial advice.
`;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Understood. I am now the UniPay Assistant." }] },
      ],
    });

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    // Log error lengkap ke terminal agar bisa kita lacak
    console.error("GEMINI API ERROR:", error);
    
    let errorMsg = "Maaf, asisten AI sedang mengalami gangguan koneksi. Coba lagi dalam beberapa saat.";
    
    if (error.message?.includes('API_KEY_INVALID')) {
      errorMsg = "API Key Gemini tidak valid. Tolong cek kembali di .env.local.";
    } else if (error.message?.includes('quota')) {
      errorMsg = "Batas penggunaan AI (Quota) tercapai. Coba lagi nanti.";
    } else if (error.message?.includes('fetch failed')) {
      errorMsg = "Gagal menghubungi server AI. Periksa koneksi internet server kamu.";
    }

    return NextResponse.json({ text: errorMsg }, { status: 500 });
  }
}
