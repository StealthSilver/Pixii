import type { SVGProps } from "react";

const stroke = {
  strokeWidth: 1.5 as number,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type GlyphProps = SVGProps<SVGSVGElement>;

function GlyphRoot({ className, children, ...props }: GlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Hooks — link-2 style */
export function HooksGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path
        d="M10 13a5 5 0 0 1 7.54.54l3 3a5 5 0 0 1-7.07 7.07l-1.72-1.71"
        {...stroke}
      />
      <path
        d="M14 11a5 5 0 0 1-7.54-.54l-3-3a5 5 0 0 1 7.07-7.07l1.71 1.71"
        {...stroke}
      />
    </GlyphRoot>
  );
}

/** AEO — search */
export function SearchGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <circle cx="11" cy="11" r="7" {...stroke} />
      <path d="m20 20-3.2-3.2" {...stroke} />
    </GlyphRoot>
  );
}

/** Rufus — bot */
export function BotGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <rect x="5" y="8" width="14" height="10" rx="2" {...stroke} />
      <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" {...stroke} />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" stroke="none" />
      <path d="M9 17h6" {...stroke} />
    </GlyphRoot>
  );
}

/** Roaster — flame */
export function FlameGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        {...stroke}
      />
    </GlyphRoot>
  );
}

/** Reviews — star outline */
export function StarGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path
        d="m12 3 2.4 5.5 6 .6-4.6 3.8 1.6 6L12 16.9 6.6 19l1.6-6L3.6 9.1l6-.6L12 3Z"
        {...stroke}
      />
    </GlyphRoot>
  );
}

/** Markets — trending chart */
export function ChartGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path d="M4 19h16" {...stroke} />
      <path d="m4 15 4-4 4 4 8-8" {...stroke} />
      <path d="M16 7h4v4" {...stroke} />
    </GlyphRoot>
  );
}

/** Creator — pen line */
export function PenGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path
        d="M12 19h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 10.5-10.5Z"
        {...stroke}
      />
    </GlyphRoot>
  );
}

/** UGC — two users */
export function UsersGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...stroke} />
      <circle cx="9" cy="7" r="3.5" {...stroke} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" {...stroke} />
      <path d="M18.5 7.5a3.5 3.5 0 1 0-7 0" {...stroke} />
    </GlyphRoot>
  );
}

/** Clipper — scissors */
export function ScissorsGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <circle cx="7" cy="7" r="3" {...stroke} />
      <circle cx="7" cy="17" r="3" {...stroke} />
      <path d="m14 4-7 20m7-11-7 11" {...stroke} />
    </GlyphRoot>
  );
}

/** Studio — palette */
export function PaletteGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path
        d="M12 3a9 9 0 1 0 9 9c0 .8-.7 1.5-1.5 1.5h-7A7.5 7.5 0 0 1 12 3Z"
        {...stroke}
      />
      <circle cx="8.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </GlyphRoot>
  );
}

/** Renderer — cube */
export function CubeGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path
        d="m21 16-9 5.25L3 16V8l9-5 9 5v8ZM3.27 7.05 12 12l8.73-4.95M12 22V12"
        {...stroke}
      />
    </GlyphRoot>
  );
}

/** Shopify — shopping bag (generic stroke, not brand mark) */
export function BagGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path d="M6 9h15l-1.3 12.2a2 2 0 0 1-2 1.8H9.3a2 2 0 0 1-2-1.8L6 9Z" {...stroke} />
      <path d="M9 11V8a3 3 0 0 1 6 0v3" {...stroke} />
    </GlyphRoot>
  );
}

/* -------- Section header glyphs (match size-3.5 in sidebar) -------- */

/** Intelligence — spark (single focal diamond) */
export function SparkGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path
        d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
        {...stroke}
      />
    </GlyphRoot>
  );
}

/** Amazon section — package */
export function PackageGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path d="m7.5 4.27 9 5.15" {...stroke} />
      <path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        {...stroke}
      />
      <path d="m3.3 7 8.7 5 8.7-5" {...stroke} />
      <path d="M12 22V12" {...stroke} />
    </GlyphRoot>
  );
}

/** Content — video */
export function FilmGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path
        d="m16 13 5.5 3.5a.5.5 0 0 0 .75-.43v-9.14a.5.5 0 0 0-.75-.43L16 10.5"
        {...stroke}
      />
      <rect x="2" y="7" width="14" height="10" rx="2" {...stroke} />
    </GlyphRoot>
  );
}

/** Visuals — eye */
export function EyeGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z" {...stroke} />
      <circle cx="12" cy="12" r="2.5" {...stroke} />
    </GlyphRoot>
  );
}

/** Store — storefront */
export function StorefrontGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path d="m2 7 4.41-4.41a2 2 0 0 1 2.82 0L14 7" {...stroke} />
      <path d="M22 7v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7" {...stroke} />
      <path d="M6 21V10h12v11" {...stroke} />
      <path d="M9 15h6" {...stroke} />
    </GlyphRoot>
  );
}
