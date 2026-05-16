import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ text: "Konfigurasi error: API Key tidak ditemukan." }, { status: 500 });
    }

    // Inisialisasi Google Generative AI dengan SDK resmi
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
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
    UniPay is stateless, non-custodial, and uses smart sessions.
    Guide users to: Dashboard, Create Payment, History, or Account tabs.
    Be concise, helpful, and professional. Always respond in the language used by the user (Indonesian if they speak Indonesian).`;

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
