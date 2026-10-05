import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/variables.css";
import { AnimationProvider } from "@/components/ui/AnimationProvider";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";

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
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/fixify-logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-porcelain text-ink antialiased">
        <WebVitalsReporter />
        {/* Skip to main content link - visible on keyboard focus */}
        <a
          href="#main-content"
          className="absolute left-0 top-0 z-50 -translate-y-full focus:translate-y-0 px-4 py-2 bg-ink text-porcelain font-semibold rounded-b text-sm transition-transform"
        >
          Skip to main content
        </a>
        <AnimationProvider>
          {children}
        </AnimationProvider>
      </body>
    </html>
  );
}
