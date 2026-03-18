import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";

  return {
    title: isEs ? "Ejemplos" : "Examples",
    description: isEs
      ? "Escucha ejemplos de audio producido con SonificaLabs: podcasts, spots publicitarios, trailers, audiocuentos y mas."
      : "Listen to audio examples produced with SonificaLabs: podcasts, ads, trailers, audiobooks and more.",
    alternates: {
      canonical: isEs ? "/examples" : "/en/examples",
      languages: { es: "/examples", en: "/en/examples", "x-default": "/examples" },
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
