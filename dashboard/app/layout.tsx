import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "../components/Web3Provider";

export const metadata: Metadata = {
  title: "HavenClaw Agent Dashboard",
  description: "Monitor and manage your autonomous AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
