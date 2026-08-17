type IconProps = { className?: string };

const shared = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconLink({ className }: IconProps) {
  return (
    <svg {...shared} className={className} aria-hidden="true">
      <path d="M9 12a4 4 0 0 0 6 3.5l3-3a4 4 0 0 0-5.5-5.8" />
      <path d="M15 12a4 4 0 0 0-6-3.5l-3 3a4 4 0 0 0 5.5 5.8" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg {...shared} className={className} aria-hidden="true">
      <path d="M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
      <circle cx="10" cy="7" r="3.2" />
      <path d="M20 20v-1a4 4 0 0 0-2.8-3.8" />
      <path d="M15 4.2a3.2 3.2 0 0 1 0 6" />
    </svg>
  );
}

export function IconGift({ className }: IconProps) {
  return (
    <svg {...shared} className={className} aria-hidden="true">
      <rect x="3" y="8" width="18" height="13" rx="1.5" />
      <path d="M3 12h18" />
      <path d="M12 8v13" />
      <path d="M12 8c-1.8 0-3.2-1-3.2-2.6C8.8 4 10 3 11.4 3c1.6 0 2.6 1.4 2.6 3v2" />
      <path d="M12 8c1.8 0 3.2-1 3.2-2.6C15.2 4 14 3 12.6 3 11 3 10 4.4 10 6v2" />
    </svg>
  );
}

export function IconArchive({ className }: IconProps) {
  return (
    <svg {...shared} className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="5" rx="1.2" />
      <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
      <path d="M10 13h4" />
    </svg>
  );
}
