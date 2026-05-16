import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ text: "Konfigurasi error: API Key tidak ditemukan." }, { status: 500 });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const SYSTEM_PROMPT = `You are UniPay Assistant, an expert in UniPay Protocol on Arc Network. 
    UniPay is stateless, non-custodial, and uses smart sessions.
    Guide users to: Dashboard, Create Payment, History, or Account tabs.
    Be concise, helpful, and professional.`;

    // MENGGUNAKAN DIRECT FETCH KE V1 STABLE (Bukan v1beta)
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }]
          },
          {
            role: "model",
            parts: [{ text: "Understood. I am now the UniPay Assistant." }]
          },
          {
            role: "user",
            parts: [{ text: lastMessage }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Google API Error");
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak bisa memberikan jawaban saat ini.";

    return NextResponse.json({ text: aiText });
  } catch (error: any) {
    // Log error tetap jalan untuk jaga-jaga
    try {
      const errorLog = `Time: ${new Date().toISOString()}\nError: ${error.message || JSON.stringify(error)}\n\n`;
      const scratchPath = path.join(process.cwd(), 'scratch', 'ai_error_log.txt');
      fs.appendFileSync(scratchPath, errorLog);
    } catch (e) {}

    return NextResponse.json({ 
      text: "Maaf, sistem AI sedang dalam pemeliharaan. Silakan coba sesaat lagi." 
    }, { status: 500 });
  }
}
