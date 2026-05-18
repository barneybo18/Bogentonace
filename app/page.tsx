"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { VantaBackground } from "@/components/VantaBackground";
import { motion } from "framer-motion";

export default function Home() {
  return (
    /* Force dark mode for the entire landing page */
    <div className="dark relative min-h-screen bg-[#0a0a0a] text-foreground overflow-hidden font-sans">

      {/* Full-Page Vanta Background with gradient mask - covers entire viewport for mouse tracking */}
      <div
        className="fixed inset-0 z-0"
        style={{
          // Fade from transparent (left) to visible (right) - lines stay on right side
          maskImage: "linear-gradient(to right, transparent 0%, transparent 30%, rgba(0,0,0,0.3) 50%, black 70%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 30%, rgba(0,0,0,0.3) 50%, black 70%)"
        }}
      >
        <VantaBackground className="w-full h-full" />
      </div>

      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 z-50">
        <Image
          src="/bogent-logo.png"
          alt="Bogent"
          width={60}
          height={60}
          className="rounded-xl shadow-lg shadow-black/20"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center lg:justify-start px-8 sm:px-12 lg:px-24 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-10 max-w-2xl text-center lg:text-left"
        >
          <div className="space-y-6">
            <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black tracking-tighter leading-[0.85] text-white">
              <span className="bg-clip-text text-transparent bg-linear-to-b from-white to-white/50">
                Bogent
              </span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl font-light text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
              <span className="text-primary font-medium">Autonomous finance</span> on Mantle.
              Secure, trustless agents designed for your automated future.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button
              size="lg"
              className="h-14 px-10 rounded-full text-lg font-bold bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10 transition-all duration-300"
              asChild
            >
              <Link href="/dashboard">
                Launch App
                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 rounded-full text-lg font-medium border-white/10 text-white hover:bg-white/5 transition-all duration-300"
              asChild
            >
              <a href="https://docs.mantle.xyz" target="_blank" rel="noopener noreferrer">
                About Mantle
              </a>
            </Button>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
