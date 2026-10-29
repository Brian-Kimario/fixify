import { notFound } from "next/navigation";

// Dev-only page: hidden in production.
export default function DevOnlyLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
