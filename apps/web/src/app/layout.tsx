import type { Metadata, Viewport } from 'next';
import { Fredoka, Quicksand, Patrick_Hand } from 'next/font/google';
import { config } from '@codi/config';
import './globals.css';
import 'katex/dist/katex.min.css';
import SkipLink from '@/components/skip-link';
import ProgressBarProvider from '@/components/progress-bar';
import { Providers } from './providers';

const superPandora = Fredoka({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-super-pandora',
  weight: ['400', '500', '600', '700'],
});

const simplyOlive = Quicksand({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-simply-olive',
  weight: ['400', '500', '600', '700'],
});

const candyBeans = Patrick_Hand({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-candy-beans',
  weight: ['400'],
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
    logo: `${config.frontendUrl}/logo.png?v=2`,
    description:
      'Plataforma educativa de programación. Aprendé lógica, estructuras de datos y algoritmos de forma interactiva.',
  };

  return (
    <html lang="es" className={`${superPandora.variable} ${simplyOlive.variable} ${candyBeans.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen font-sans antialiased"
      >
        <SkipLink />
        <Providers>
        <ProgressBarProvider>
          <main id="main-content">
          {children}
        </main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        </ProgressBarProvider>
        </Providers>
      </body>
    </html>
  );
}
