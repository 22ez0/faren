import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

/**
 * VisualOptionCard — the universal "card with real preview + label + bullets"
 * shape used everywhere in the dashboard. Inspired by the Layout tab pattern.
 *
 * Why: Faren stops looking like guns.lol the moment every choice (theme, effect,
 * background, link, font, badge…) is shown VISUALLY before you click it.
 */
export interface VisualOptionCardProps {
  selected?: boolean;
  onClick?: () => void;
  /** Big visual area at the top — render whatever preview makes sense. */
  preview: ReactNode;
  /** Bottom title (UPPERCASE in display). */
  label: string;
  /** Optional 1-line tagline below the label. */
  tagline?: string;
  /** Optional bullet list ("Bom para"). */
  bestFor?: string[];
  /** Optional bullet list ("Atenção"). */
  tradeoffs?: string[];
  /** Custom badge text when selected (defaults to "Em uso"). */
  selectedLabel?: string;
  /** Custom badge text when not selected (defaults to "Escolher"). */
  idleLabel?: string;
  /** Aspect ratio of the preview area. Defaults to 4/3. */
  previewAspect?: string;
  /** Disable the card (used for "soon" features). */
  disabled?: boolean;
  /** Small overlay text on the disabled state. */
  disabledNote?: string;
  /** Compact mode (for grids of many items, e.g. fonts). */
  compact?: boolean;
  /** data-testid */
  "data-testid"?: string;
}

export function VisualOptionCard({
  selected = false,
  onClick,
  preview,
  label,
  tagline,
  bestFor,
  tradeoffs,
  selectedLabel = "Em uso",
  idleLabel = "Escolher",
  previewAspect = "4/3",
  disabled = false,
  disabledNote = "Em breve",
  compact = false,
  ...rest
}: VisualOptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      data-testid={rest["data-testid"]}
      className="group relative text-left w-full rounded-2xl border overflow-hidden transition-colors disabled:cursor-not-allowed"
      style={{
        backgroundColor: selected
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.015)",
        borderColor: selected
          ? "rgba(255,255,255,0.55)"
          : "rgba(255,255,255,0.08)",
        boxShadow: selected ? "0 0 0 1px rgba(255,255,255,0.18)" : "none",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* preview area */}
      <div
        className="relative w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border-b border-white/5"
        style={{ aspectRatio: previewAspect }}
      >
        {/* faren glow accent — recurrent identity element */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(140,180,255,0.10), transparent 55%)",
          }}
        />
        <div className="absolute inset-0">{preview}</div>

        {disabled && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/70 border border-white/15 rounded-full px-3 py-1 bg-black/40">
              {disabledNote}
            </span>
          </div>
        )}
      </div>

      {/* meta */}
      <div className={compact ? "px-3 py-3" : "px-4 py-4"}>
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`font-bold uppercase tracking-[0.18em] text-white ${
              compact ? "text-[11px]" : "text-sm"
            }`}
          >
            {label}
          </h3>
          {selected ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-white text-black shrink-0">
              <Check className="w-3 h-3" strokeWidth={3} />
              {selectedLabel}
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-white/15 text-white/40 group-hover:text-white group-hover:border-white/40 transition-colors shrink-0">
              {idleLabel}
            </span>
          )}
        </div>

        {tagline && !compact && (
          <p className="mt-2 text-xs text-white/55 leading-relaxed">{tagline}</p>
        )}

        {bestFor && bestFor.length > 0 && !compact && (
          <div className="mt-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/35 mb-1.5">
              Bom para
            </p>
            <ul className="space-y-1">
              {bestFor.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[11px] text-white/70 leading-snug"
                >
                  <span className="mt-1 w-1 h-1 rounded-full bg-white/60 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tradeoffs && tradeoffs.length > 0 && !compact && (
          <div className="mt-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/35 mb-1.5">
              Atenção
            </p>
            <ul className="space-y-1">
              {tradeoffs.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[11px] text-white/45 leading-snug"
                >
                  <span className="mt-1 w-1 h-1 rounded-full bg-white/30 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Tiny shared section header used everywhere in the dashboard.
 */
export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h2 className="text-base md:text-[17px] font-bold uppercase tracking-[0.18em] text-white leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-xs text-white/45 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/**
 * SliderCard — labeled range input with a description, used in Tema/Avançado.
 */
export function SliderCard({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
  description,
  ...rest
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
  description?: string;
  "data-testid"?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">{label}</p>
        <span className="text-[11px] font-mono text-white/70 tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-3 accent-white"
        data-testid={rest["data-testid"]}
      />
      {description && (
        <p className="mt-2 text-[11px] text-white/40 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

/**
 * Faren signature glyph — recurring identity element used as a brand mark.
 * A six-pointed star in pure SVG, animated with a subtle pulse.
 */
export function FarenGlyph({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 1.5 L13.5 9.5 L21.5 11 L13.5 12.5 L12 22 L10.5 12.5 L2.5 11 L10.5 9.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}
