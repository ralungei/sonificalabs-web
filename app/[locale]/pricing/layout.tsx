import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";

  return {
    title: isEs ? "Precios" : "Pricing",
    description: isEs
      ? "Planes y precios de SonificaLabs. Empieza gratis, sin tarjeta. Produce podcasts, spots y mas con IA."
      : "SonificaLabs plans and pricing. Start free, no credit card required. Produce podcasts, ads and more with AI.",
    alternates: {
      canonical: isEs ? "/pricing" : "/en/pricing",
      languages: { es: "/pricing", en: "/en/pricing", "x-default": "/pricing" },
    },
  };
}

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do credits work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Each production has a base cost of 10 credits, plus 5 credits per generated voice. A production with 2 voices costs 20 credits, one with 8 voices costs 50.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can cancel your subscription at any time. You will keep access until the end of your billing period.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use the audio commercially?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paid plans include a commercial license. You can use generated audio in ads, podcasts, YouTube videos, social media and any commercial project.",
      },
    },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      {children}
    </>
  );
}
