"use client";

import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";

interface FadeInProps extends PropsWithChildren {
  delay?: number;
  y?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, y = 10, className }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
