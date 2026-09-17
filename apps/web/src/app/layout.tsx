import type { Metadata } from "next";
import { Chakra_Petch, Geist_Mono, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Tipografia do HUD. Chakra Petch é a face de display — títulos e rótulos em
// caixa alta espaçada, como um menu de jogo. Não é variável: pesos explícitos.
const chakra = Chakra_Petch({
  variable: "--font-chakra",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

// Texto corrido e interface. Legível onde a Chakra Petch seria cansativa.
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

// URLs e números (XP, estrelas) — sempre em mono tabular.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mollire",
  description: "Publique, receba estrelas, suba de nível.",
  // O favicon vem de app/icon.svg (convenção de arquivo): a marca nova, em SVG.
  // O apple-icon ainda é a chama antiga — trocar quando houver o PNG da marca.
  icons: { apple: "/apple-icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // .dark engata as variantes dark: do shadcn; o tema em si já é escuro em :root.
    <html
      lang="pt-BR"
      className={`dark ${chakra.variable} ${plex.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
