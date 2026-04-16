import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  char?: string;
}

interface ParticleCanvasProps {
  effect: string;
  accentColor?: string;
}

const EFFECTS: Record<string, { colors: string[], count: number, char?: string }> = {
  snow: { colors: ['#fff', '#ddd', '#eee'], count: 80 },
  stars: { colors: ['#fff', '#ffd700', '#aad4f5'], count: 60 },
  sakura: { colors: ['#ffb7c5', '#ff8fab', '#ffc4d0', '#ffb3c1'], count: 50 },
  fireflies: { colors: ['#aaff80', '#80ff80', '#d4ff80'], count: 40 },
  bubbles: { colors: ['rgba(255,255,255,0.15)', 'rgba(139,92,246,0.2)', 'rgba(255,255,255,0.1)'], count: 35 },
  rain: { colors: ['rgba(255,255,255,0.15)', 'rgba(100,150,255,0.2)'], count: 100 },
};

export default function ParticleCanvas({ effect, accentColor }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || effect === 'none' || !EFFECTS[effect]) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = EFFECTS[effect];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawn = (): Particle => {
      const isRain = effect === 'rain';
      const isBubble = effect === 'bubbles';
      const isFirefly = effect === 'fireflies';

      return {
        x: Math.random() * canvas.width,
        y: isRain ? Math.random() * -100 : Math.random() * canvas.height,
        vx: isRain ? 0.5 : isFirefly ? (Math.random() - 0.5) * 0.8 : (Math.random() - 0.5) * 0.4,
        vy: isRain ? 6 + Math.random() * 4 : isBubble ? -(0.3 + Math.random() * 0.5) : 0.5 + Math.random() * 1,
        alpha: 0.7 + Math.random() * 0.3,
        size: isRain ? (1 + Math.random() * 1.5) : isBubble ? (8 + Math.random() * 20) : isFirefly ? (2 + Math.random() * 3) : (3 + Math.random() * 5),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
      };
    };

    particlesRef.current = Array.from({ length: cfg.count }, spawn);

    const drawSakura = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      const s = p.size;
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 5);
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.6, s * 0.4, s * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };

    const drawBubble = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.strokeStyle = p.color.replace('rgba(', '').startsWith('#') ? p.color : p.color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (effect === 'fireflies') {
          p.vx += (Math.random() - 0.5) * 0.1;
          p.vy += (Math.random() - 0.5) * 0.1;
          p.vx = Math.max(-1, Math.min(1, p.vx));
          p.vy = Math.max(-1, Math.min(1, p.vy));
          p.alpha = 0.3 + Math.sin(Date.now() * 0.003 + idx) * 0.4;
        }

        if (p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
          particlesRef.current[idx] = { ...spawn(), y: effect === 'bubbles' ? canvas.height + 20 : -20 };
        }

        if (effect === 'bubbles') {
          drawBubble(ctx, p);
        } else if (effect === 'sakura') {
          drawSakura(ctx, p);
        } else if (effect === 'rain') {
          ctx.save();
          ctx.globalAlpha = p.alpha * 0.4;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 2, p.y + p.size * 3);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          if (effect === 'fireflies') {
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
          } else if (effect === 'stars') {
            for (let i = 0; i < 5; i++) {
              const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
              const r = i % 2 === 0 ? p.size : p.size * 0.4;
              ctx[i === 0 ? 'moveTo' : 'lineTo'](p.x + r * Math.cos(angle), p.y + r * Math.sin(angle));
            }
            ctx.closePath();
          } else {
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.restore();
        }
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [effect, accentColor]);

  if (effect === 'none' || !EFFECTS[effect]) return null;

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{ opacity: 0.85 }}
    />
  );
}
