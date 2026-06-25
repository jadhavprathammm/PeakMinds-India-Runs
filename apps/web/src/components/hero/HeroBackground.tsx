"use client";

import { motion } from "framer-motion";

// Designed atmospheric backdrop for the Hero.
// Layers (back → front): a base color wash, large blurred light sources,
// a faint edge-masked technical grid, and a vignette that focuses the centre.
// The whole field fades in slowly so the scene feels alive before any
// foreground content begins to animate.

export default function HeroBackground() {
  return (
    <motion.div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2.2, ease: "easeOut" }}
      aria-hidden="true"
    >
      {/* Base wash — a faint purple lift over the near-black body colour */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 72% 8%, rgba(72, 28, 78, 0.30) 0%, rgba(10,10,10,0) 55%)",
        }}
      />

      {/* Primary pink light — top-right, sits behind the dashboard */}
      <div className="absolute -top-[14%] right-[1%] w-[55vw] max-w-[760px] aspect-square rounded-full bg-accent/[0.10] blur-[180px]" />

      {/* Violet mesh light — centre, bridges the three columns */}
      <div
        className="absolute top-[28%] left-[38%] w-[48vw] max-w-[620px] aspect-square rounded-full blur-[170px] opacity-[0.10]"
        style={{ backgroundColor: "#8b5cf6" }}
      />

      {/* Secondary pink — lower-left, keeps the text column warm */}
      <div className="absolute bottom-[0%] left-[-8%] w-[40vw] max-w-[480px] aspect-square rounded-full bg-accent/[0.05] blur-[150px]" />

      {/* Faint technical grid — edge-masked so it never competes with content */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 78% 62% at 50% 42%, #000 22%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 78% 62% at 50% 42%, #000 22%, transparent 80%)",
        }}
      />

      {/* Vignette — deepens the edges to give the scene a sense of volume */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 48%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </motion.div>
  );
}
