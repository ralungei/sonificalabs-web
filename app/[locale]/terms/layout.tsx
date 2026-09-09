import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";

  return {
    title: isEs ? "Terminos de uso" : "Terms of Service",
    description: isEs
      ? "Terminos y condiciones de uso de SonificaLabs."
      : "SonificaLabs terms and conditions of use.",
    alternates: {
      canonical: isEs ? "/es/terms" : "/terms",
      languages: { en: "/terms", es: "/es/terms", "x-default": "/terms" },
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
