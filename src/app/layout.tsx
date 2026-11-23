import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces, Inter, Nunito, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Every font a café can choose is declared once; the browser only downloads the ones a page uses.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["600", "700", "800"] });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["600", "700"] });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", weight: ["500", "700"] });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["400", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Cafe Kit · la web de tu cafetería con carta QR", template: "%s" },
  description: "Plantilla de web para cafeterías: carta con código QR, pedidos por WhatsApp o Telegram y un panel para cambiarlo todo sin saber programar.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={[inter, bricolage, fraunces, playfair, space, nunito].map((f) => f.variable).join(" ")}
    >
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
