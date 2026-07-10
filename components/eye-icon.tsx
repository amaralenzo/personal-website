export function EyeIcon({ size = 11 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.2 6C2.7 3.5 4.3 2.3 6 2.3S9.3 3.5 10.8 6C9.3 8.5 7.7 9.7 6 9.7S2.7 8.5 1.2 6z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="6" r="1.4" fill="currentColor" />
    </svg>
  );
}
