import type { Metadata } from "next";
import {
  Bebas_Neue,
  Montserrat,
  Oswald,
  DM_Serif_Display,
} from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});
const dmSerif = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dmserif",
});

export const metadata: Metadata = {
  title: {
    default: "The Heads Up! Foundation | Your game is just the beginning.",
    template: "%s | The Heads Up! Foundation",
  },
  description:
    "A Dallas–Fort Worth 501(c)(3) enriching the lives of youth through education, sports, and mentoring since 2003.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebas.variable} ${montserrat.variable} ${oswald.variable} ${dmSerif.variable}`}
      >
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
