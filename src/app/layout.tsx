import type { Metadata } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import "./globals.css";

const body = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-condensed",
});

export const metadata: Metadata = {
  title: "MOVINN — Configurador modular",
  description: "Mobilidade sob medida. Configure sua cadeira MOVINN em tempo real.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${body.className} ${condensed.variable}`}>{children}</body>
    </html>
  );
}
