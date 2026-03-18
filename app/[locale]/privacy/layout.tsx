import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";

  return {
    title: isEs ? "Politica de privacidad" : "Privacy Policy",
    description: isEs
      ? "Politica de privacidad de SonificaLabs. Como recogemos, usamos y protegemos tus datos."
      : "SonificaLabs privacy policy. How we collect, use and protect your data.",
    alternates: {
      canonical: isEs ? "/privacy" : "/en/privacy",
      languages: { es: "/privacy", en: "/en/privacy", "x-default": "/privacy" },
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
