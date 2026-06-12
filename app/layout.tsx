import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Marquee from "@/components/Marquee";

export const metadata: Metadata = {
  title: "Nipah Route Map — Kozhikode",
  description:
    "Public-awareness route map of the confirmed Nipah virus case in Kozhikode, Kerala (June 2026).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Marquee />
        {children}
      </body>
    </html>
  );
}
