/**
 * Fixify Logo Symbol
 * Rooftop + connection node mark
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
    >
      {/* Rooftop shape */}
      <path
        d="M24 8L8 18V32H40V18L24 8Z"
        fill="currentColor"
        opacity="0.9"
      />

      {/* Connection lines from rooftop corners */}
      <line
        x1="8"
        y1="18"
        x2="16"
        y2="32"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <line
        x1="40"
        y1="18"
        x2="32"
        y2="32"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Center connection node */}
      <circle cx="24" cy="38" r="3" fill="currentColor" opacity="0.8" />

      {/* Connection lines to center node */}
      <line
        x1="16"
        y1="32"
        x2="22"
        y2="36"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <line
        x1="32"
        y1="32"
        x2="26"
        y2="36"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}
