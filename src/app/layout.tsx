import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { AIFloatingButton } from "@/components/layout/AIFloatingButton";
import { MainContainer } from "@/components/layout/MainContainer";
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
  title: "UniPay | Decentralized Payment Checkout Protocol",
  description: "Accept USDC/EURC from any chain, settle in < 1 second. Fully onchain protocol powered by Arc Network.",
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
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-gray-100 selection:bg-violet-600 selection:text-white overflow-x-hidden">
        <Web3Provider>
          {/* Ambient glow background */}
          <div className="glow-bg" />
          <Navbar />
          <AIFloatingButton />
          <MainContainer>
            {children}
          </MainContainer>
        </Web3Provider>
      </body>
    </html>
  );
}
