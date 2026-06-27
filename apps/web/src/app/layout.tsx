import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import { config } from '@codi/config';
import './globals.css';
import SkipLink from '@/components/skip-link';

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: {
    default: 'Codi — Aprendé programación',
    template: '%s | Codi',
  },
  description:
    'Plataforma educativa de programación. Aprendé lógica, estructuras de datos y algoritmos de forma interactiva.',
  metadataBase: new URL(config.frontendUrl),
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Codi',
    title: 'Codi — Aprendé programación',
    description:
      'Plataforma educativa de programación. Aprendé lógica, estructuras de datos y algoritmos de forma interactiva.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codi — Aprendé programación',
    description:
      'Plataforma educativa de programación. Aprendé lógica, estructuras de datos y algoritmos de forma interactiva.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f0f1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Codi',
    url: config.frontendUrl,
    logo: `${config.frontendUrl}/logo.png`,
    description:
      'Plataforma educativa de programación. Aprendé lógica, estructuras de datos y algoritmos de forma interactiva.',
  };

  return (
    <html lang="es" className={nunito.variable}>
      <body
        suppressHydrationWarning
        className="min-h-screen font-sans antialiased"
      >
        <SkipLink />
        <main id="main-content">
          {children}
        </main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
