"use client";

import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({ value, prefix = "", suffix = "" }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest).toLocaleString("en-US"));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.6,
      ease: "easeOut",
    });
    return controls.stop;
  }, [motionValue, value]);

  return (
    <motion.span>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}
