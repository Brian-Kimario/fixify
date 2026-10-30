import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface ActiveJob {
  href: string;
  /** What the job is, for example the service name. */
  title: string;
  /** Where it stands, from STATE_META copy. */
  status: string;
  /** Further jobs in progress beyond this one. */
  more: number;
}

function Pulse() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-60 motion-reduce:hidden" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal" />
    </span>
  );
}

/** Compact chip in the desktop top bar. */
export function ActiveJobChip({ job }: { job: ActiveJob }) {
  return (
    <Link
      href={job.href}
      className="hidden min-h-11 max-w-[17rem] items-center gap-2.5 rounded-full border border-teal/25 bg-teal-wash px-3.5 text-sm text-teal-deep transition-colors hover:bg-teal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper lg:inline-flex"
    >
      <Pulse />
      <span className="min-w-0 truncate">
        <span className="font-semibold">{job.status}</span>
        <span className="text-teal-deep/75"> · {job.title}</span>
      </span>
      {job.more > 0 && (
        <span className="shrink-0 rounded-full bg-paper px-1.5 text-xs font-semibold">+{job.more}</span>
      )}
    </Link>
  );
}

/** Full-width strip under the header below the `lg` breakpoint. */
export function ActiveJobStrip({ job }: { job: ActiveJob }) {
  return (
    <Link
      href={job.href}
      className="flex min-h-11 items-center gap-3 border-b border-teal/20 bg-teal-wash px-4 text-sm text-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal lg:hidden"
    >
      <Pulse />
      <span className="min-w-0 flex-1 truncate">
        <span className="font-semibold">{job.status}</span>
        <span className="text-teal-deep/75"> · {job.title}</span>
        {job.more > 0 && <span className="text-teal-deep/75"> · +{job.more} more</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}
