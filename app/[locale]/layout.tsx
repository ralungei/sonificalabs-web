import type { Metadata } from "next";
import { DM_Sans, Be_Vietnam_Pro } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Providers } from "@/components/Providers";
import { routing } from "@/i18n/routing";
import "../globals.css";

const dmSans = DM_Sans({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-logo",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const BASE_URL = "https://sonificalabs.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: isEs
        ? "SonificaLabs | Produce audio profesional con IA"
        : "SonificaLabs | AI Audio Production",
      template: "%s | SonificaLabs",
    },
    description: isEs
      ? "Produce audio profesional con IA: podcasts, spots, trailers y mas. Voces, musica, efectos y mezcla automatica en segundos."
      : "AI-powered professional audio production: podcasts, ads, trailers and more. Voices, music, SFX and automatic mixing in seconds.",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      type: "website",
      siteName: "SonificaLabs",
      locale: isEs ? "es_ES" : "en_US",
      images: [
        {
          url: "/cover-share.png",
          width: 1200,
          height: 630,
          alt: "SonificaLabs - AI Audio Production",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/cover-share.png"],
    },
    alternates: {
      canonical: isEs ? "/" : "/en",
      languages: {
        es: "/",
        en: "/en",
        "x-default": "/",
      },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SonificaLabs",
  url: BASE_URL,
  logo: `${BASE_URL}/favicon.svg`,
  description: "AI-powered professional audio production platform",
  founder: {
    "@type": "Person",
    name: "Ras Alungei",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@sonificalabs.com",
    contactType: "customer service",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${dmSans.variable} ${beVietnam.variable} bg-surface-0`}>
      <body className="min-h-screen font-body antialiased bg-surface-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
