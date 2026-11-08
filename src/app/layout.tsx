import "./globals.css";
import type { Metadata, Viewport } from "next";
import { WalletProvider } from "@/context/WalletContext";
import { Navbar } from "@/components/layout/Navbar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F1E3" },
    { media: "(prefers-color-scheme: dark)", color: "#12170F" },
  ],
};

export const metadata: Metadata = {
  title: "ProofRoom — Private intelligence. Verifiable trust.",
  description:
    "Verifiably private AI virtual data room powered by Intel TDX confidential computing and NEAR Testnet on-chain audit receipts.",
  keywords: [
    "Virtual Data Room",
    "Confidential Computing",
    "Intel TDX",
    "NEAR Protocol",
    "End-to-End Encryption",
    "Private AI",
    "Due Diligence",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen min-h-[100dvh] flex flex-col bg-background text-foreground antialiased overflow-x-hidden w-full max-w-full">
        <WalletProvider>
          <Navbar />
          <div className="flex-1 flex flex-col w-full">{children}</div>
        </WalletProvider>
      </body>
    </html>
  );
}
