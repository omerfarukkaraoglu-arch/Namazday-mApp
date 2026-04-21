import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Namazdayım",
  description: "Okul Namaz Yoklama ve Takip Sistemi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Namazdayım",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#0B0F1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
