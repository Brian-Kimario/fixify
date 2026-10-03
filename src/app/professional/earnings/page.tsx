import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { getProfessionalEarningsLedger } from '@/app/professional/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Earnings Ledger — Fixify Professional',
};

export default async function EarningsPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user) {
    redirect('/auth/login');
  }

  let ledger;
  try {
    ledger = await getProfessionalEarningsLedger();
  } catch (err) {
    console.error('Error loading earnings ledger:', err);
    ledger = {
      totalEarned: 0,
      completedJobsCount: 0,
      averageRate: 0,
      thisMonthEarned: 0,
      thisWeekEarned: 0,
      pendingPayouts: 0,
      monthlyBreakdown: [],
      recentTransactions: [],
    };
  }

  const hasEarnings = ledger.totalEarned > 0 || ledger.recentTransactions.length > 0;

  return (
    <div className="pb-24 md:pb-12 px-4 md:px-6 max-w-6xl mx-auto space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/professional"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A6661] hover:text-[#176B5B] transition-colors"
        >
          ← Back to Operations Dashboard
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-2">
          FINANCIAL OPERATIONS
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#18211F] mb-2">
          Earnings & Settlement Ledger
        </h1>
        <p className="text-[#5A6661] max-w-2xl">
          Real-time record of all verified work, approved quotes, and completed service payouts.
        </p>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {/* Total Earned */}
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6 shadow-sm hover:border-[#176B5B] transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
                Total Completed Value
              </p>
              <p className="text-3xl md:text-4xl font-bold text-[#176B5B]">
                ₹{ledger.totalEarned.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-[#7C8681] mt-2">
                All-time verified job completions
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#E2EEE9] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#176B5B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <path d="M1 10h22" />
              </svg>
            </div>
          </div>
        </div>

        {/* Jobs Completed */}
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6 shadow-sm hover:border-[#176B5B] transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
                Completed Jobs
              </p>
              <p className="text-3xl md:text-4xl font-bold text-[#18211F]">
                {ledger.completedJobsCount}
              </p>
              <p className="text-xs text-[#7C8681] mt-2">
                Closed with signed completion
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#E2EEE9] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#176B5B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Average Rate */}
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6 shadow-sm hover:border-[#176B5B] transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
                Average Value / Job
              </p>
              <p className="text-3xl md:text-4xl font-bold text-[#18211F]">
                ₹{Math.round(ledger.averageRate).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-[#7C8681] mt-2">
                Including approved parts & labour
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#E2EEE9] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#176B5B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 17" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown & Quick Payout Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] block mb-1">
                HISTORY
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[#18211F]">
                Monthly Breakdown
              </h2>
            </div>
            <span className="text-xs text-[#5A6661]">Last 4 Months</span>
          </div>

          {!hasEarnings ? (
            <div className="p-8 text-center text-[#5A6661] text-xs">
              No historical billing data yet. Once you complete scheduled jobs, monthly earnings trends will display here.
            </div>
          ) : (
            <div className="space-y-5">
              {ledger.monthlyBreakdown.map((m) => (
                <div key={m.month} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-semibold text-[#18211F]">{m.month}</span>
                      <span className="text-xs text-[#7C8681] ml-2">({m.jobs} {m.jobs === 1 ? 'job' : 'jobs'})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#176B5B]">₹{m.earned.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-[#7C8681] ml-2">{m.rate}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#E2EEE9] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#176B5B] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, m.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Settlement Card (1 col) */}
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] block mb-1">
              CURRENT CYCLE
            </span>
            <h2 className="text-lg font-bold text-[#18211F]">
              Settlement Status
            </h2>
          </div>

          <div className="p-3.5 bg-[#E2EEE9]/70 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#176B5B] block">This Month's Completed</span>
            <span className="text-2xl font-bold text-[#176B5B]">
              ₹{ledger.thisMonthEarned.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 bg-[#F7F4EC] rounded-xl space-y-1">
            <span className="text-xs font-semibold text-[#5A6661] block">In-Progress / Pending Authorization</span>
            <span className="text-xl font-bold text-[#18211F]">
              ₹{ledger.pendingPayouts.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="pt-3 border-t border-[#D9DED8] space-y-2 text-xs text-[#5A6661]">
            <div className="flex justify-between">
              <span>Payout Schedule:</span>
              <span className="font-semibold text-[#18211F]">Weekly (Every Friday)</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee:</span>
              <span className="font-semibold text-[#18211F]">Standard 5%</span>
            </div>
            <div className="flex justify-between">
              <span>Disbursement:</span>
              <span className="font-semibold text-[#176B5B]">Direct Bank / UPI</span>
            </div>
          </div>
        </div>

      </div>

      {/* Real Transactions Ledger */}
      <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 md:px-6 py-4 md:py-5 border-b border-[#D9DED8] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] block mb-0.5">
              AUDIT TRAIL
            </span>
            <h2 className="text-lg md:text-xl font-bold text-[#18211F]">
              Recent Job Transactions
            </h2>
          </div>
          <span className="text-xs text-[#7C8681]">
            {ledger.recentTransactions.length} RECORDED
          </span>
        </div>

        {ledger.recentTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E2EEE9] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#176B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[#18211F] mb-1">No transaction records yet</h3>
            <p className="text-xs text-[#5A6661] max-w-sm mx-auto">
              When you accept and complete service visits or submit approved quotes, each transaction will be recorded here with timestamps.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#D9DED8]">
            {ledger.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="px-5 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#F9FAF8] transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#18211F] text-sm md:text-base">
                      {tx.jobTitle}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                        tx.status === 'completed'
                          ? 'bg-[#E2EEE9] text-[#176B5B] border-[#B8D5CB]'
                          : tx.status === 'pending'
                          ? 'bg-[#F5EBD7] text-[#9B6A1E] border-[#DDCCAB]'
                          : 'bg-[#FFF4E0] text-[#9B6700] border-[#E8D5A3]'
                      }`}
                    >
                      {tx.status === 'completed' ? 'Completed' : tx.status === 'pending' ? 'Quote Pending' : 'In Progress'}
                    </span>
                  </div>
                  <div className="text-xs text-[#5A6661] mt-0.5">
                    Customer: <span className="font-medium text-[#18211F]">{tx.customerName}</span> · Date: {tx.date}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="text-right">
                    <span className="text-base md:text-lg font-bold text-[#176B5B]">
                      +₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[11px] text-[#7C8681]">
                      ID: {tx.id.slice(0, 8)}…
                    </span>
                  </div>
                  <Link
                    href={`/professional/jobs/${tx.id}`}
                    className="px-3 py-1.5 border border-[#D9DED8] rounded-lg text-xs font-semibold text-[#5A6661] hover:bg-[#E2EEE9] hover:text-[#176B5B] hover:border-[#B8D5CB] transition"
                  >
                    View Job →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
