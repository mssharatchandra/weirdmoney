import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);

  return {
    title: "WYRD — the internet's weird money",
    description: "An autonomous cultural desk hunting the strangest things people are putting actual money on.",
    metadataBase: base,
    openGraph: {
      title: "WYRD — the internet's weird money",
      description: "Real money. Deeply unreal bets.",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "WYRD — the internet's weird money" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "WYRD — the internet's weird money",
      description: "Real money. Deeply unreal bets.",
      images: ["/og.png"],
    },
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
