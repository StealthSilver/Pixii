import type { SVGProps } from "react";

/** Stroke weight tuned for ~20px sidebar nav (reads with filled MUI icons). */
const stroke = {
  strokeWidth: 1.35 as number,
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

/** Creator — pen / writing line */
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

/** UGC — camera (user-shot content) */
export function CameraGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <path
        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"
        {...stroke}
      />
      <circle cx="12" cy="13" r="3.5" {...stroke} />
    </GlyphRoot>
  );
}

/** Clipper — scissors (rings + crossed blades) */
export function ScissorsGlyph(props: GlyphProps) {
  return (
    <GlyphRoot {...props}>
      <circle cx="6" cy="6" r="3" {...stroke} />
      <circle cx="6" cy="18" r="3" {...stroke} />
      <path d="M20 4 8.12 15.88" {...stroke} />
      <path d="M8.12 8.12 12 12" {...stroke} />
      <path d="M12 12 8.12 15.88" {...stroke} />
      <path d="m14.47 14.48 5.53 5.52" {...stroke} />
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

/* -------- Section header glyphs (match size-3.5 in sidebar) -------- */

type BrandGlyphProps = GlyphProps;

function BrandGlyphRoot({ className, children, ...props }: BrandGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Amazon wordmark + smile (path from Simple Icons, CC0). */
export function AmazonGlyph(props: BrandGlyphProps) {
  return (
    <BrandGlyphRoot {...props}>
      <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512 1.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z" />
    </BrandGlyphRoot>
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

/** Shopify mark (path from Simple Icons, CC0). */
export function ShopifyGlyph(props: BrandGlyphProps) {
  return (
    <BrandGlyphRoot {...props}>
      <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z" />
    </BrandGlyphRoot>
  );
}
