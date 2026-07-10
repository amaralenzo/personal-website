import type { CSSProperties } from "react";

interface CursorArrowProps {
  color?: string;
  ghost?: boolean;
  className?: string;
  size?: number;
  backgroundColor?: string;
  style?: CSSProperties;
}

export function CursorArrow({
  color,
  ghost = false,
  className,
  size = 19,
  backgroundColor = "var(--color-bg)",
  style,
}: CursorArrowProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 19 19"
      fill="none"
      aria-hidden="true"
      style={style}
    >
      <path
        d="M2.5 1.9l5.9 14.3 2.1-6.2 6.2-2.1L2.5 1.9z"
        fill={ghost ? backgroundColor : color}
        stroke={ghost ? "var(--color-pencil)" : backgroundColor}
        strokeWidth={ghost ? 1.25 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
