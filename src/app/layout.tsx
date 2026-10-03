import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/variables.css";
import { AnimationProvider } from "@/components/ui/AnimationProvider";

export const metadata: Metadata = {
  title: "Fixify — Property maintenance, properly managed",
  description:
    "Connect with verified professionals for property maintenance. Describe your problem and let Fixify handle the rest.",
  keywords: [
    "property maintenance",
    "home repairs",
    "marketplace",
    "verified professionals",
    "plumbing",
    "electrical",
    "handyman",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F4EC",
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
      <body className="min-h-full flex flex-col bg-porcelain text-ink antialiased">
        <AnimationProvider>
          {children}
        </AnimationProvider>
      </body>
    </html>
  );
}
