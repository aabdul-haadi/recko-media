import "./brand-logo.css";

type BrandLogoProps = { variant?: "paper" | "ink"; large?: boolean };

/** Vector lockup drawn from the supplied Recko brand reference. */
export function BrandLogo({ variant = "paper", large = false }: BrandLogoProps) {
  return (
    <span
      role="img"
      aria-label="ReckoMEDIA"
      className={`recko-brand-logo recko-brand-logo-${variant}${large ? " recko-brand-logo-large" : ""}`}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <rect width="64" height="64" rx="15" className="recko-brand-logo-ground" />
        <path
          d="M21 47V18h12c8 0 12 4 12 10s-4 10-12 10H21"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="recko-brand-logo-r"
        />
        <path
          d="m32 37 12 13"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="recko-brand-logo-leg"
        />
      </svg>
      <span className="recko-brand-logo-type" aria-hidden="true">
        <span>Recko</span>
        <span>MEDIA</span>
      </span>
    </span>
  );
}
