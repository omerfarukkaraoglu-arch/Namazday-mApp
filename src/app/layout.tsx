import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Namazdayım",
  description: "Okul Namaz Yoklama ve Takip Sistemi",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#3b82f6",
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
