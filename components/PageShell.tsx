"use client";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.main
      initial={{ backgroundColor: "#FFFFFF" }}
      animate={{ backgroundColor: "#F0F0F0" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen"
    >
      <Navbar />

      <section className="text-center pt-28 pb-10 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-display-sm md:text-display-md lg:text-display-lg font-logo tracking-tight text-text-primary mb-1 leading-tight"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-text-secondary text-body-lg"
        >
          {subtitle}
        </motion.p>
      </section>

      {children}
    </motion.main>
  );
}
