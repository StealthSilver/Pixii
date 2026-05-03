import type { CSSProperties } from "react";

type StoreIconProps = {
  className?: string;
  size?: number | string;
  opacity?: number;
  rotation?: number;
  shadow?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  padding?: number;
  ariaHidden?: boolean;
};

export function StoreIcon({
  className,
  size,
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0,
  ariaHidden,
}: StoreIconProps) {
  const transforms: string[] = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
  if (flipHorizontal) transforms.push("scaleX(-1)");
  if (flipVertical) transforms.push("scaleY(-1)");

  const viewBoxSize = 24 + padding * 2;
  const viewBoxOffset = -padding;
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

  const style: CSSProperties = {
    opacity,
    transform: transforms.length ? transforms.join(" ") : undefined,
    filter:
      shadow > 0
        ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))`
        : undefined,
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size ?? undefined}
      height={size ?? undefined}
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      <path d="M4.423 5.5v-1h15.154v1zm.077 14v-6H3.27v-1l1.153-5h15.154l1.154 5v1H19.5v6h-1v-6h-5v6zm1-1h7v-5h-7z" />
    </svg>
  );
}
