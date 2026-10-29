import Link from 'next/link';

/**
 * Staff console placeholder. The support role exists (and its database policies
 * are live) but ticketing is not built yet: it needs a ticket table, a way for
 * customers to open tickets, and an agent queue. Customers and professionals
 * get help from /customer/support and /professional/support.
 */
export default function SupportConsolePage() {
  return (
    <div className="max-w-[560px] py-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-teal">Coming soon</p>
      <h1 className="mt-4 font-editorial text-[clamp(34px,6vw,52px)] font-normal leading-[1.05] tracking-[-0.02em]">
        The support queue isn’t ready yet.
      </h1>
      <p className="mt-5 text-[16px] leading-relaxed text-ink-3">
        Ticketing, escalations and complaint handling are still being built. Your support account is set up and
        will work here once they ship. Until then there is nothing to action in this console.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/help"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal px-6 text-[15px] font-semibold text-porcelain transition-colors hover:bg-teal-deep"
        >
          Open the help centre
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line-strong bg-paper px-6 text-[15px] font-semibold text-ink transition-colors hover:border-ink-3"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
