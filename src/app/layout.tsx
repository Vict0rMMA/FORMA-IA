import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FORMA AI",
  description: "Nutrición, calorías y progreso físico con inteligencia artificial.",
  appleWebApp: { capable: true, title: "FORMA AI", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="bg-bg">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-bg text-fg antialiased`}>
        {children}
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "!bg-surface-2 !border !border-line-strong !text-fg !rounded-2xl !shadow-none !font-sans",
              description: "!text-muted",
              actionButton: "!bg-lime !text-lime-ink !rounded-full !font-medium",
            },
          }}
        />
      </body>
    </html>
  );
}
