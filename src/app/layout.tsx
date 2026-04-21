import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CsrfProvider } from "@/components/providers/csrf-provider";
import { ErrorBoundary } from "@/components/common/error-boundary";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BluePrint - نظام إدارة مكاتب الاستشارات الهندسية",
  description: "نظام متكامل لإدارة مكاتب الاستشارات الهندسية في الإمارات | Integrated Engineering Consultancy Management System for UAE",
  keywords: ["BluePrint", "engineering", "consultancy", "UAE", "management", "إدارة", "هندسة", "استشارات", "الإمارات"],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BluePrint",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2557",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        {/* Early script: set language direction BEFORE React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem("blueprint-lang")||"ar";document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr"}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${ibmPlexArabic.variable} ${plusJakarta.variable} antialiased bg-background text-foreground font-[family-name:var(--font-ibm-plex-arabic)]`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <CsrfProvider>
            <ErrorBoundary locale="ar">
              {children}
            </ErrorBoundary>
            <Toaster />
          </CsrfProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
