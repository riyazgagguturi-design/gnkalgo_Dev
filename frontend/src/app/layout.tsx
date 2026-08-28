import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GNK ALGO — Intelligence behind every trade",
  description: "Algo platform for the Indian stock market. Connect Dhan and Groww, run strategies, AI signals, and webhooks.",
  icons: {
    icon: "/gnkalgo-brand.png",
    apple: "/gnkalgo-brand.png",
  },
};

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('gnk_theme') || 'background-1';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="background-1" suppressHydrationWarning>
      <head>
        <script>{themeInitScript}</script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
