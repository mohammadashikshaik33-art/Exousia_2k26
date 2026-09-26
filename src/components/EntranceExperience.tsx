"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEntrance } from "@/context/EntranceContext";

function getDeterministicRotation(index: number): string {
  // Pure, idempotent pseudo-random generator to satisfy React purity rules
  const x = Math.sin(index + 1) * 10000;
  const rand = x - Math.floor(x);
  return `${(rand - 0.5) * 720}deg`;
}

export default function EntranceExperience() {
  const { state, closeCircuit } = useEntrance();
  const [lettersRevealed, setLettersRevealed] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [introFinished, setIntroFinished] = useState(state === "unlocked");

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const text = "EXOUSIA";

  const [revealedStates, setRevealedStates] = useState<boolean[]>(
    Array(text.length).fill(false)
  );
  const [letterOpacities, setLetterOpacities] = useState<number[]>(
    Array(text.length).fill(0)
  );

  // 1. Reveal Sequence on Mount
  useEffect(() => {
    if (state === "unlocked") {
      const timer = setTimeout(() => {
        setIntroFinished(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Trigger stagger reveals
    text.split("").forEach((_, index) => {
      const delay = index * 150 + Math.random() * 100 + 1000; // 1s initial delay
      setTimeout(() => {
        setRevealedStates((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });

        // Trigger micro-flickers
        let flickers = 0;
        const interval = setInterval(() => {
          setLetterOpacities((prev) => {
            const next = [...prev];
            next[index] = Math.random() > 0.5 ? 0.5 : 1;
            return next;
          });
          flickers++;
          if (flickers > 5) {
            clearInterval(interval);
            setLetterOpacities((prev) => {
              const next = [...prev];
              next[index] = 1;
              return next;
            });
          }
        }, 50);
      }, delay);
    });

    // After all letters are revealed
    const finishDelay = text.length * 150 + 1800;
    const finishTimer = setTimeout(() => {
      setLettersRevealed(true);
      setIsGlitching(true);
    }, finishDelay);

    return () => {
      clearTimeout(finishTimer);
    };
  }, [state]);

  // 2. Click Transition Trigger
  const handleTitleClick = () => {
    if (!lettersRevealed || isCollapsing) return;

    // Hard glitch
    if (titleRef.current) {
      titleRef.current.style.animation = "glitch-anim 0.2s infinite";
    }

    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.style.animation = "none";
      }
      setIsCollapsing(true);

      // Trigger concurrent fade-out of intro and reveal of main page as letters fall past center
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.opacity = "0";
        }
        closeCircuit(); // Unlock main page content concurrently
        
        // Wait for the fade animation to complete before completely unmounting intro UI
        setTimeout(() => {
          setIntroFinished(true);
        }, 1000);
      }, 800);
    }, 400);
  };

  if (introFinished || state === "unlocked") return null;

  return (
    <div 
      ref={containerRef}
      id="intro-container"
      style={{
        transition: "opacity 1s ease-in-out",
        opacity: 1,
      }}
      className="crt-overlay select-none"
    >
      <div 
        ref={titleRef}
        className={`title-container text-center flex flex-col items-center ${
          isGlitching ? "is-glitching" : ""
        }`}
        onClick={handleTitleClick}
      >
        <div 
          className="font-display text-headline-xl md:text-[120px] md:leading-[120px] tracking-widest text-primary font-bold cursor-pointer glitch-text"
          data-text="EXOUSIA"
        >
          {text.split("").map((char, index) => {
            const isRev = revealedStates[index];
            const op = letterOpacities[index];
            return (
              <span
                key={index}
                className={`title-letter ${isCollapsing ? "falling" : ""}`}
                style={{
                  opacity: isRev ? op : 0,
                  filter: isRev ? "blur(0px)" : "blur(10px)",
                  transform: isRev 
                    ? (isCollapsing ? undefined : "scale(1) translateY(0)") 
                    : "scale(1.1) translateY(20px)",
                  // Set custom variable for fall rotation
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  "--rot": getDeterministicRotation(index),
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        <p 
          id="click-hint"
          style={{
            transition: "opacity 1s ease-in-out",
            opacity: lettersRevealed ? (isCollapsing ? 0 : 0.5) : 0,
          }}
          className="font-tech text-label-mono text-on-surface-variant tracking-[0.3em] uppercase mt-8 text-center"
        >
          Initialize Sequence
        </p>
      </div>
    </div>
  );
}
