type LogoProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function MovinnMark({ inverse = false }: Pick<LogoProps, "inverse">) {
  const navy = inverse ? "#FAF7F2" : "#0B1F3B";

  return (
    <svg className="movinn-mark" viewBox="0 0 100 100" role="img" aria-label="Símbolo MOVINN">
      <circle cx="51" cy="13" r="8.5" fill={navy} />
      <path d="M46 38c-18-2-32 10-34 27-2 18 11 32 29 33 16 1 29-8 34-22" fill="none" stroke={navy} strokeWidth="11" strokeLinecap="round" />
      <path d="M14 49c10-16 29-24 44-20 11 3 17 11 14 22-3 12-16 24-33 34 9-12 17-25 18-35 1-7-4-11-11-12-10-1-21 4-32 11Z" fill="#FF6B3D" />
      <path d="M68 38c12 6 20 19 20 32 0 12-6 22-17 28 5-12 7-23 4-33-2-9-7-16-14-21Z" fill="#2ECCB0" />
    </svg>
  );
}

export function MovinnLogo({ compact = false, inverse = false }: LogoProps) {
  return (
    <span className={compact ? "movinn-logo compact" : "movinn-logo"}>
      <MovinnMark inverse={inverse} />
      {!compact && (
        <span className="movinn-wordmark">
          <strong>movinn</strong>
          <small>mobilidade sob medida</small>
        </span>
      )}
    </span>
  );
}
