/**
 * Fixify Logo Symbol
 * Approved stroke-based mark: property roof + connection structure + intelligent node
 * Per BRAND_ASSETS.md specification
 */

interface SymbolProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export function Symbol({ size = "md", className = "" }: SymbolProps) {
  const dimension = sizes[size];

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Roof line: property outline */}
      <path
        d="M8 30 L24 13 L40 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left support line: from left roof corner */}
      <line
        x1="24"
        y1="13"
        x2="15"
        y2="35"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Right support line: from right roof corner */}
      <line
        x1="24"
        y1="13"
        x2="33"
        y2="35"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Intelligent node: center connection point */}
      <circle
        cx="24"
        cy="13"
        r="3.6"
        fill="var(--fx-teal, #176B5B)"
        opacity="1"
      />
    </svg>
  );
}
