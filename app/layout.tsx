import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import { ThemeProvider } from "@/components/ThemeProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

// SEO Metadata
export const metadata: Metadata = {
  // Basic Meta
  title: {
    default: "BOGENT - Autonomous AI Payment Agents on Mantle",
    template: "%s | BOGENT",
  },
  description:
    "Deploy self-funded AI agents that automatically execute recurring crypto payments on Mantle Network. Trustless payroll, subscriptions, and rent payments with ultra-low fees.",
  keywords: [
    "Mantle Network",
    "crypto payments",
    "automated payments",
    "recurring payments",
    "AI agents",
    "DeFi",
    "Web3",
    "blockchain",
    "payroll",
    "subscriptions",
    "MNT",
    "USDT",
    "USDC",
    "smart contracts",
    "decentralized finance",
  ],
  authors: [{ name: "BOGENT Team" }],
  creator: "BOGENT",
  publisher: "BOGENT",

  // Canonical URL
  metadataBase: new URL("https://bogent.vercel.app"),
  alternates: {
    canonical: "/",
  },

  // Open Graph (Facebook, LinkedIn, Discord)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bogent.vercel.app",
    siteName: "BOGENT",
    title: "BOGENT - Autonomous AI Payment Agents on Mantle",
    description:
      "Deploy self-funded AI agents that automatically execute recurring crypto payments. Trustless automation for payroll, subscriptions, and rent on Mantle Network.",
    images: [
      {
        url: "/icon.png",
        width: 1200,
        height: 630,
        alt: "BOGENT - Autonomous Payment Agents",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "BOGENT - Autonomous AI Payment Agents",
    description:
      "Self-funded AI agents for recurring crypto payments on Mantle. Ultra-low fees, fully trustless.",
    images: ["/icon.png"],
    creator: "@oboh_banny18",
  },

  // Robots & Indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },

  // App Manifest
  manifest: "/manifest.json",

  // Category
  category: "Finance",

  // Other
  applicationName: "BOGENT",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "BOGENT",
              description:
                "Autonomous AI payment agents for recurring crypto payments on Mantle Network",
              url: "https://bogent.vercel.app",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "BOGENT Team",
                url: "https://bogent.vercel.app",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${outfit.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="black"
          themes={["light", "dark", "black"]}
          enableSystem
        >
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
