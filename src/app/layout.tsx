import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Web3Provider } from "@/context/Web3Provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Morphic | Private Transfers on Arc",
  description: "The most private way to send stablecoins on Arc Network — powered by zero-knowledge proofs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#07070a] text-gray-100 selection:bg-violet-600 selection:text-white overflow-x-hidden">
        <Web3Provider>
          {/* Ambient glow background */}
          <div className="glow-bg" />
          <Navbar />
          <main className="flex-1 pt-24 px-4 pb-28 md:pb-12 flex items-start justify-center relative z-10">
            <div className="w-full max-w-[480px]">
              {children}
            </div>
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
