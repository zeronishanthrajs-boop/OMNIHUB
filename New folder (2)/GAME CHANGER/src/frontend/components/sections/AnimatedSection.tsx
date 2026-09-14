"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface AnimatedSectionProps {
  children: ReactNode;
  enabled: boolean;
  delay: number;
}

export function AnimatedSection({ children, enabled, delay }: AnimatedSectionProps) {
  if (!enabled) {
    return <section>{children}</section>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
    >
      {children}
    </motion.section>
  );
}
