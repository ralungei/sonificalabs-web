"use client";

import { motion } from "framer-motion";

/**
 * Frame shared by every console section.
 *
 * The generator used an 880px container and the history a 980px one, so on
 * wide screens the title jumped 50px sideways and the list changed width when
 * switching sections. One width, one header, defined once.
 */
export function ConsolePage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[960px] px-5 pb-20 pt-8 md:px-8 md:pt-12">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        {/* The @utility type scale sets size only, so headings inherited the
            body's 1.5 line-height (30px type in a 45px line). */}
        <h1 className="m-0 text-[clamp(32px,3.6vw,48px)] font-normal leading-[1.04] tracking-[-0.06em] text-ink">{title}</h1>
        {subtitle ? <p className="mb-0 mt-3 text-base leading-[1.45] text-text-secondary">{subtitle}</p> : null}
      </motion.header>
      {children}
    </div>
  );
}
