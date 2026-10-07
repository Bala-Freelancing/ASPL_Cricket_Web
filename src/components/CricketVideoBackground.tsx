'use client';

import { useState, useEffect, useRef } from 'react';

export default function HeroVideoBackground() {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleMotionChange);
    }

    return () => {
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', handleMotionChange);
      }
    };
  }, []);

  useEffect(() => {
    if (mounted && videoRef.current && !prefersReducedMotion) {
      videoRef.current.play().catch((err) => {
        console.log('Autoplay prevented, retrying muted play:', err);
      });
    } else if (videoRef.current && prefersReducedMotion) {
      videoRef.current.pause();
    }
  }, [mounted, prefersReducedMotion]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* Background Video */}
      {!prefersReducedMotion && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 w-full h-full object-cover opacity-75 filter brightness-95 contrast-110"
        >
          <source src="/videos/aspl-hero.mp4" type="video/mp4" />
        </video>
      )}

      {/* Primary Layered Vertical Gradient Overlay over Video */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(3, 5, 10, 0.18) 0%, rgba(3, 5, 10, 0.22) 35%, rgba(3, 5, 10, 0.45) 58%, rgba(3, 5, 10, 0.78) 78%, rgba(3, 5, 10, 0.95) 100%)',
        }}
      />

      {/* Secondary Radial Overlay over Video */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(3, 5, 10, 0.10) 0%, rgba(3, 5, 10, 0.30) 65%, rgba(3, 5, 10, 0.55) 100%)',
        }}
      />
    </div>
  );
}
