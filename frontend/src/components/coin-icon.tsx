export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fill="currentColor"
        fontSize="6"
        fontFamily="sans-serif"
      >
        HC
      </text>
    </svg>
  );
}
