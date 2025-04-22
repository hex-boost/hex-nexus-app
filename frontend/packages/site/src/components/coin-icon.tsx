export function CoinIcon({ className, color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      {}
      <circle cx="12" cy="12" r="6" strokeWidth={0.5} />
      {}
      <path d="M10 13L12 10L14 13" />
      <path d="M10 13L14 13" />
    </svg>
  );
}
