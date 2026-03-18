import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";

  return {
    title: isEs ? "Quienes somos" : "About us",
    description: isEs
      ? "Conoce a Ras, el fundador de SonificaLabs. Ingeniero y creador de contenido, construyendo la plataforma de produccion de audio con IA."
      : "Meet Ras, the founder of SonificaLabs. Engineer and content creator, building the AI audio production platform.",
    alternates: {
      canonical: isEs ? "/about" : "/en/about",
      languages: { es: "/about", en: "/en/about", "x-default": "/about" },
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
