import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, DM_Sans } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { AIFloatingButton } from "@/components/layout/AIFloatingButton";
import { MainContainer } from "@/components/layout/MainContainer";
import { Web3Provider } from "@/context/Web3Provider";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
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

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "LumiPay | Decentralized Payment Checkout Protocol",
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
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-[#FEF7ED] text-slate-900 selection:bg-[#fc5000] selection:text-white overflow-x-hidden"
        style={{ fontFamily: 'var(--font-dm-sans), var(--font-geist-sans), sans-serif' }}
      >
        <Web3Provider>
          {/* Mirage-style ambient background */}
          <GlobalBackground />
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
