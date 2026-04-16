import { useEffect, useRef, useCallback } from "react";

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  char: string;
}

const EFFECTS: Record<string, string[]> = {
  hearts: ['❤️', '🧡', '💜', '💙', '💗', '💖'],
  stars: ['⭐', '✨', '💫', '🌟', '⚡'],
  sparkles: ['✦', '✧', '✶', '✷', '✸', '✹'],
  explosions: ['💥', '🔥', '⚡', '💢'],
};

interface ClickEffectProps {
  effect: string;
}

let nextId = 0;

export default function ClickEffect({ effect }: ClickEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chars = EFFECTS[effect];

  const handleClick = useCallback((e: MouseEvent) => {
    if (!chars || !containerRef.current) return;

    const count = effect === 'explosions' ? 1 : 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'click-particle';
      particle.style.left = `${e.clientX}px`;
      particle.style.top = `${e.clientY}px`;
      particle.style.fontSize = effect === 'sparkles' ? '20px' : '24px';
      particle.style.animationDuration = `${0.6 + Math.random() * 0.6}s`;
      const angle = (i / count) * Math.PI * 2;
      const dist = 20 + Math.random() * 40;
      particle.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`;
      particle.textContent = chars[Math.floor(Math.random() * chars.length)];

      if (effect === 'sparkles') {
        particle.style.color = `hsl(${Math.random() * 60 + 260}, 80%, 75%)`;
      }

      document.body.appendChild(particle);
      particle.addEventListener('animationend', () => particle.remove());
    }
  }, [chars, effect]);

  useEffect(() => {
    if (!chars) return;
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [chars, handleClick]);

  return null;
}
