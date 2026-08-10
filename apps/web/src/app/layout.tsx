import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Azeroth Social — O Mural dos Campeões de WoW",
  description: "A taverna social onde a comunidade de World of Warcraft se reúne dentro e fora do jogo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className={`${cinzel.variable} ${inter.variable} antialiased bg-[#0F1218] text-[#D8E2EC] font-sans border-box`}>
        {children}
      </body>
    </html>
  );
}
