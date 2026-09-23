import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/variables.css";

export const metadata: Metadata = {
  title: "Fixify - Property Maintenance Marketplace",
  description:
    "Connect property managers and professionals with skilled technicians for property maintenance.",
  keywords: [
    "property management",
    "maintenance",
    "marketplace",
    "handyman",
    "repairs",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0b0d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col bg-dark text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
