import type { Metadata } from "next";
import {
  Bebas_Neue,
  JetBrains_Mono,
  Montserrat,
  Oswald,
} from "next/font/google";
import "./globals.css";
import { FlowProvider } from "@/components/vgm/flow";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
});
const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-head",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The Virtual GM | HeadsUP OS",
  description:
    "Your AI-powered front office. Built for coaches who recruit to win.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${bebas.variable} ${oswald.variable} ${jetbrains.variable}`}
    >
      <body className="font-ui antialiased min-h-screen">
        <FlowProvider>{children}</FlowProvider>
      </body>
    </html>
  );
}
