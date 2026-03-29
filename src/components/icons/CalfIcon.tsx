import type { CSSProperties } from "react";

interface CalfIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Calf (baby cow) icon — used for Destete & Reproducción.
 * Drawn at 24×24 viewBox, same convention as lucide-react icons so it can
 * drop in wherever <Baby /> was used.
 */
export function CalfIcon({ size = 24, color = "currentColor", className, style }: CalfIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="12" cy="13.5" rx="6.5" ry="4.5" fill={color} />

      {/* Head */}
      <ellipse cx="17.5" cy="10.5" rx="3" ry="2.5" fill={color} />

      {/* Ear left */}
      <ellipse
        cx="15.2"
        cy="8.3"
        rx="1.1"
        ry="0.75"
        transform="rotate(-30 15.2 8.3)"
        fill={color}
      />

      {/* Ear right */}
      <ellipse
        cx="19.6"
        cy="8.5"
        rx="1.1"
        ry="0.75"
        transform="rotate(20 19.6 8.5)"
        fill={color}
      />

      {/* Snout */}
      <ellipse cx="19.8" cy="11.4" rx="1.3" ry="0.9" fill={color} opacity="0.35" />

      {/* Nostril left */}
      <circle cx="19.2" cy="11.5" r="0.28" fill={color} opacity="0.7" />
      {/* Nostril right */}
      <circle cx="20.4" cy="11.5" r="0.28" fill={color} opacity="0.7" />

      {/* Eye */}
      <circle cx="17.9" cy="9.9" r="0.45" fill={color} opacity="0.75" />

      {/* Legs — four short stubs */}
      <rect x="6.5"  y="17.5" width="1.4" height="3" rx="0.7" fill={color} />
      <rect x="9.2"  y="17.8" width="1.4" height="2.7" rx="0.7" fill={color} />
      <rect x="13"   y="17.8" width="1.4" height="2.7" rx="0.7" fill={color} />
      <rect x="15.7" y="17.5" width="1.4" height="3" rx="0.7" fill={color} />

      {/* Tail */}
      <path
        d="M5.6 12.5 C4.5 11.5 4 10 4.5 9 C5 8.2 5.8 9 5.5 10.5"
        stroke={color}
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
