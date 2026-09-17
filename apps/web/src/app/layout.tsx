import type { Metadata } from "next";
import { EB_Garamond, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const classicalSerif = EB_Garamond({
  variable: "--font-classical-serif",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mollire",
  description: "Deploy de frontends por subdomínio.",
  icons: {
    icon: [
      { url: "/icon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${classicalSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
