import type { Metadata } from "next";
import { Montserrat, Barlow_Condensed, Space_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-ui" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The Virtual GM | HeadsUP OS",
  description:
    "The front-office execution layer of HeadsUP OS. We scout from the neck up.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${barlow.variable} ${spaceMono.variable} font-ui antialiased min-h-screen bg-ink`}
      >
        {children}
      </body>
    </html>
  );
}
