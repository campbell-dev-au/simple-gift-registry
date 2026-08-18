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

export function IconGoogle({ className }: IconProps) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13 17.7 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.5 3-2.2 5.5-4.7 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-17.4Z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.7l7.9-6.1Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.4-5.7c-2.1 1.4-4.7 2.2-7.8 2.2-6.3 0-11.6-4.3-13.5-10l-7.9 6.1C6.5 42.6 14.6 48 24 48Z"
      />
    </svg>
  );
}
