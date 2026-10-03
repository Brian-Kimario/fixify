import Image from "next/image";

/**
 * Fixify Logo Symbol
 * Enlarged, transparent puzzle piece mark that adapts seamlessly to any background.
 */
interface SymbolProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export function Symbol({ size = "md", className = "", priority = true }: SymbolProps) {
  const dimension = sizes[size];

  return (
    <Image
      src="/brand/fixify-logo.svg"
      alt="Fixify"
      aria-hidden="true"
      width={dimension}
      height={dimension}
      priority={priority}
      className={`object-contain flex-shrink-0 ${className}`}
    />
  );
}
