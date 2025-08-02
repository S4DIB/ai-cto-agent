"use client";
import React, { useEffect, useRef, useState } from "react";
import Particles from "../components/Particles";
import { TypewriterEffectSmooth } from "../components/ui/typewriter-effect";
import { Button } from "../components/ui/button";

// DecryptedText animation component
type DecryptedTextProps = { text: string; className?: string; duration?: number };
const DecryptedText = ({ text, className = "", duration = 1200 }: DecryptedTextProps) => {
  const [display, setDisplay] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.max(10, Math.floor(duration / 30));
    intervalRef.current = setInterval(() => {
      frame++;
      setDisplay((prev) => {
        return text
          .split("")
          .map((c: string, i: number) => {
            if (c === " ") return " ";
            if (frame < totalFrames && Math.random() > frame / totalFrames) {
              return chars[Math.floor(Math.random() * chars.length)];
            }
            return c;
          })
          .join("");
      });
      if (frame >= totalFrames) {
        setDisplay(text);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 30);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [text, duration]);
  return (
    <span className={className} style={{ letterSpacing: "0.15em" }}>{display}</span>
  );
};

// RotatingText component for animated word swap
type RotatingTextProps = { words: string[]; interval?: number; className?: string };
const RotatingText = ({ words, interval = 2000, className = "" }: RotatingTextProps) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval]);
  return <span className={className}>{words[index]}</span>;
};

export default function Home() {
  const [showSecond, setShowSecond] = useState(false);
  const [showRotating, setShowRotating] = useState(false);
  const [showStaticSecondLine, setShowStaticSecondLine] = useState(false);

  // Synchronized timer for header, rotating text, and glitch
  const [currentTick, setCurrentTick] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const headerPhrases = ["AI CTO AGENT", "CREATE HISTORY"];
  const rotatingWords = ["startup?", "business?"];
  const intervalMs = 3000; // 5 seconds for sync
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTick((tick) => tick + 1);
      setGlitch(true);
      setTimeout(() => setGlitch(false), 700); // glitch for 0.7s
    }, intervalMs);
    return () => clearInterval(interval);
  }, []);
  // Header phrase and rotating word index
  const headerIndex = currentTick % headerPhrases.length;
  const rotatingIndex = currentTick % rotatingWords.length;
  // For DecryptedText re-mount
  const [headerKey, setHeaderKey] = useState(0);
  useEffect(() => { setHeaderKey((k) => k + 1); }, [headerIndex]);

  // When the second line animation is done, start rotating text after a short delay
  useEffect(() => {
    if (showSecond) {
      const t = setTimeout(() => setShowRotating(true), 1200); // match second line animation duration
      return () => clearTimeout(t);
    }
  }, [showSecond]);

  // When rotating text is done, show the static second line
  useEffect(() => {
    if (showRotating) {
      setShowStaticSecondLine(true); // switch immediately
    }
  }, [showRotating]);

  // Add Montserrat font import to the document head if not already present
  if (typeof window !== 'undefined') {
    const id = 'montserrat-font-link';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap';
      document.head.appendChild(link);
    }
  }

  // Header styles
  const headerStyle = {
    width: '100vw',
    padding: '0.5rem clamp(1rem, 4vw, 2.5rem)',
    position: 'fixed' as 'fixed',
    top: '0',
    left: '0',
    zIndex: 10,
    background: 'rgba(10,10,35,0.85)',
    borderBottom: '4px solid transparent',
    borderImage: 'linear-gradient(90deg, transparent 0%, #60a5fa 15%, #a78bfa 85%, transparent 100%) 1',
    boxShadow: '0 2px 16px 0 rgba(0,0,0,0.12)',
    fontFamily: 'Kode Mono, monospace',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
  const navLinkStyle =
    'text-white text-lg font-kode-mono px-4 py-1 rounded transition-colors duration-200 hover:text-blue-400 hover:bg-blue-900/40';

  return (
    <>
      <header style={headerStyle}>
        <div style={{ width: '100%', maxWidth: 1200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
          <DecryptedText
            key={headerKey}
            text={headerPhrases[headerIndex]}
            className="text-white text-xl sm:text-2xl font-extrabold tracking-widest font-kode-mono truncate"
            duration={1200}
          />
          <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
            <a href="/" className={navLinkStyle}>Home</a>
            <a href="/chat" className={navLinkStyle}>Chat</a>
            <a href="/agents" className={navLinkStyle}>Agents</a>
            <a href="#contact" className={navLinkStyle}>Contact</a>
          </nav>
        </div>
      </header>
      <div style={{ position: 'fixed', inset: 0, background: '#000000', zIndex: 0 }}>
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={180}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={120}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
        <div style={{ position: 'relative', width: '100vw', height: '100vh', zIndex: 1, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'auto',
            }}
          >
            <div className={glitch ? 'glitch' : ''}>
              <div
                className="rounded-xl px-8 py-3 bg-black/40 flex items-center justify-center"
                style={{
                  fontWeight: 900,
                  color: '#e5e5e5',
                  minHeight: '3.5rem',
                  fontFamily: 'Montserrat, sans-serif',
                  lineHeight: 1.1,
                  letterSpacing: '0.02em',
                }}
              >
                {!showRotating ? (
                  <TypewriterEffectSmooth
                    words={[
                      { text: "Not" },
                      { text: "sure" },
                      { text: "how" },
                      { text: "to" },
                      { text: "turn" },
                      { text: "your" },
                      { text: "tech" },
                      { text: "idea" },
                      { text: "into" },
                      { text: "a" },
                      { text: "startup?" },
                    ]}
                    className="uppercase text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl font-montserrat font-black text-center drop-shadow-lg mb-4"
                    cursorClassName="bg-white"
                    onDone={() => setShowSecond(true)}
                    cursorCharacter="_"
                    showCursor={!showSecond}
                  />
                ) : (
                  <span
                    className="uppercase text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl font-montserrat font-black text-center drop-shadow-lg mb-4"
                    style={{ lineHeight: 1.1, letterSpacing: '0.02em' }}
                  >
                    Not sure how to turn your tech idea into a{' '}
                    <span className="inline-block ml-2 bg-[#6c47ff] text-white rounded-xl px-6 py-1 font-montserrat font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl">
                      {rotatingWords[rotatingIndex]}
                    </span>
                  </span>
                )}
              </div>
              <div
                className="rounded-xl px-8 py-3 bg-black/40 flex items-center justify-center"
                style={{
                  minHeight: '3.5rem',
                  width: '100%',
                  fontWeight: 900,
                  color: '#e5e5e5',
                  fontFamily: 'Montserrat, sans-serif',
                  lineHeight: 1.1,
                  letterSpacing: '0.02em',
                }}
              >
                {!showStaticSecondLine ? (
                  <TypewriterEffectSmooth
                    words={
                      showSecond
                        ? [
                            { text: "Let" },
                            { text: "your" },
                            { text: "AI" },
                            { text: "CTO" },
                            { text: "handle" },
                            { text: "all" },
                            { text: "the" },
                            { text: "technical", className: "text-blue-500" },
                            { text: "heavy", className: "text-blue-500" },
                            { text: "lifting.", className: "text-blue-500" },
                          ]
                        : [
                            { text: "Let".replace(/./g, ' ') },
                            { text: "your".replace(/./g, ' ') },
                            { text: "AI".replace(/./g, ' ') },
                            { text: "CTO".replace(/./g, ' ') },
                            { text: "handle".replace(/./g, ' ') },
                            { text: "all".replace(/./g, ' ') },
                            { text: "the".replace(/./g, ' ') },
                            { text: "technical".replace(/./g, ' ') },
                            { text: "heavy".replace(/./g, ' ') },
                            { text: "lifting.".replace(/./g, ' ') },
                          ]
                    }
                    className="uppercase text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl font-montserrat font-black text-center drop-shadow-lg"
                    cursorClassName="bg-white"
                    cursorCharacter={showSecond ? "_" : undefined}
                    fadeIn={showSecond}
                    showCursor={showSecond}
                  />
                ) : (
                  <span
                    className="uppercase text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl font-montserrat font-black text-center drop-shadow-lg"
                    style={{ lineHeight: 1.1, letterSpacing: '0.02em' }}
                  >
                    LET YOUR AI CTO HANDLE ALL THE <span className="text-[#6c47ff]">TECHNICAL HEAVY LIFTING.</span>
                  </span>
                )}
              </div>
              {/* Buttons below the animated text */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '4rem' }}>
                <Button
                  size="lg"
                  className="bg-[#6c47ff] text-white rounded-lg font-kode-mono px-8 py-3 text-lg shadow-lg hover:bg-[#7d5fff] transition-colors border-2 border-[#6c47ff]"
                  onClick={() => window.location.href = '/chat'}
                >
                  Try Me
                </Button>
                <Button
                  size="lg"
                  className="bg-transparent text-[#6c47ff] border-2 border-[#6c47ff] rounded-lg font-kode-mono px-8 py-3 text-lg shadow-lg hover:bg-[#6c47ff] hover:text-white transition-colors"
                >
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
