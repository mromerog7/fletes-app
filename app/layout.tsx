import type { Metadata, Viewport } from 'next';
import { Inter, Sora, JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

// ============================================================
// Fuentes — Cargadas desde Google Fonts (optimizadas por Next.js)
// ============================================================
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
  display: 'swap',
});

// ============================================================
// SEO + PWA Metadata
// ============================================================
export const metadata: Metadata = {
  title: {
    default: 'FletesPro — Cotización Inteligente',
    template: '%s | FletesPro',
  },
  description:
    'Sistema de cotización para logística ligera. Calcula rutas, distancias y costos de flete en tiempo real.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FletesPro',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: 'website',
    title: 'FletesPro — Cotización Inteligente',
    description: 'Cotiza fletes con precisión. Rutas reales, precios exactos.',
    siteName: 'FletesPro',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0C10',
};

// ============================================================
// Root Layout
// ============================================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* PWA meta tags adicionales */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        {/* Toast notifications — Sonner */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              border: '1px solid #E2E2E2',
              color: '#000000',
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
