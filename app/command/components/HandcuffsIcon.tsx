export default function HandcuffsIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left cuff - D shape */}
      <path d="M3 10a4 4 0 0 1 4-4h1a4 4 0 0 1 0 8H7a4 4 0 0 1-4-4z" />
      {/* Right cuff - D shape mirrored */}
      <path d="M21 10a4 4 0 0 0-4-4h-1a4 4 0 0 0 0 8h1a4 4 0 0 0 4-4z" />
      {/* Chain - three links */}
      <path d="M10.5 10h3" />
      <circle cx="12" cy="10" r="0.5" fill="currentColor" stroke="none" />
      {/* Left keyhole */}
      <circle cx="6.5" cy="10" r="0.8" />
      <line x1="6.5" y1="10.8" x2="6.5" y2="12" />
      {/* Right keyhole */}
      <circle cx="17.5" cy="10" r="0.8" />
      <line x1="17.5" y1="10.8" x2="17.5" y2="12" />
      {/* Hinge bars */}
      <line x1="7" y1="14" x2="7" y2="16" />
      <line x1="17" y1="14" x2="17" y2="16" />
    </svg>
  );
}
