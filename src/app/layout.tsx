import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { KioskProvider } from "@/lib/kioskStore";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SIMS Hospital — AI Assistant Kiosk",
  description: "SIMS Hospital interactive kiosk — Book appointments, find doctors, access emergency services, and more.",
};

export const viewport = {
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <KioskProvider>
            {children}
          </KioskProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
