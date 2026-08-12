import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary-400 to-accent origin-left z-[100] shadow-[0_0_10px_rgba(var(--primary),0.5)]"
    />
  );
}
