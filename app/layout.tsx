import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AccountMenu from "./components/AccountMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SEO_DESCRIPTION =
  "تابع أسعار الذهب في العراق لحظة بلحظة — سعر غرام ومثقال عيار 21 مع تحديث مستمر وحركة السوق.";

export const metadata: Metadata = {
  metadataBase: new URL("https://goldary.vercel.app"),
  title: {
    default: "Goldary — أسعار الذهب في العراق",
    template: "%s | Goldary",
  },
  description: SEO_DESCRIPTION,
  keywords: [
    "أسعار الذهب في العراق",
    "سعر الذهب اليوم",
    "ذهب عيار 21",
    "سعر المثقال",
    "Goldary",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_IQ",
    siteName: "Goldary",
    title: "Goldary — أسعار الذهب في العراق",
    description: SEO_DESCRIPTION,
    url: "https://goldary.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
  },
  appleWebApp: {
    capable: true,
    title: "Goldary",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AccountMenu />
        {children}
      </body>
    </html>
  );
}
