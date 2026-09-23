import { getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';

export const metadata = {
  title: 'Earnings - Fixify Professional',
};

// Mock earnings data - will be replaced with database queries
const mockEarningsData = [
  {
    month: 'September',
    earned: 2450,
    jobs: 5,
    rate: '$490 avg',
  },
  {
    month: 'August',
    earned: 1850,
    jobs: 4,
    rate: '$462 avg',
  },
  {
    month: 'July',
    earned: 3200,
    jobs: 6,
    rate: '$533 avg',
  },
  {
    month: 'June',
    earned: 2100,
    jobs: 5,
    rate: '$420 avg',
  },
];

const mockTransactions = [
  {
    id: '1',
    job: 'Paint Living Room Walls',
    amount: 350,
    date: '2 days ago',
    status: 'completed',
  },
  {
    id: '2',
    job: 'Fix Kitchen Faucet',
    amount: 150,
    date: '1 week ago',
    status: 'completed',
  },
  {
    id: '3',
    job: 'Bathroom Tile Installation',
    amount: 750,
    date: '2 weeks ago',
    status: 'completed',
  },
  {
    id: '4',
    job: 'Electrical Outlet Repair',
    amount: 200,
    date: '3 weeks ago',
    status: 'completed',
  },
  {
    id: '5',
    job: 'Door Lock Installation',
    amount: 200,
    date: '1 month ago',
    status: 'pending',
  },
];

export default async function EarningsPage() {
  const profile = await getCurrentProfile();

  const totalEarned = mockEarningsData.reduce((sum, month) => sum + month.earned, 0);
  const totalJobs = mockEarningsData.reduce((sum, month) => sum + month.jobs, 0);
  const averageRate = totalEarned / totalJobs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-4xl text-ink mb-2">
            Earnings Dashboard
          </h1>
          <p className="text-line text-lg">
            Track your income and completed jobs
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="space-y-2">
              <p className="text-line text-sm">Total Earned</p>
              <p className="font-display font-bold text-3xl text-mint">
                ${totalEarned.toLocaleString()}
              </p>
              <p className="text-line text-xs">All time</p>
            </div>
          </Card>
          <Card>
            <div className="space-y-2">
              <p className="text-line text-sm">Jobs Completed</p>
              <p className="font-display font-bold text-3xl text-ink">{totalJobs}</p>
              <p className="text-line text-xs">Total jobs</p>
            </div>
          </Card>
          <Card>
            <div className="space-y-2">
              <p className="text-line text-sm">Average Rate</p>
              <p className="font-display font-bold text-3xl text-ink">
                ${averageRate.toFixed(0)}
              </p>
              <p className="text-line text-xs">Per job</p>
            </div>
          </Card>
        </div>

        {/* Monthly Breakdown */}
        <Card>
          <div className="space-y-6">
            <h2 className="font-display font-bold text-xl text-ink">Monthly Breakdown</h2>
            <div className="space-y-4">
              {mockEarningsData.map((month) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-ink font-medium">{month.month}</p>
                      <p className="text-line text-sm">{month.jobs} jobs</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-lg text-mint">
                        ${month.earned}
                      </p>
                      <p className="text-line text-xs">{month.rate}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-line/10 rounded-full h-2">
                    <div
                      className="bg-mint h-2 rounded-full transition-all"
                      style={{
                        width: `${(month.earned / Math.max(...mockEarningsData.map((m) => m.earned))) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <div className="space-y-6">
            <h2 className="font-display font-bold text-xl text-ink">Recent Transactions</h2>
            <div className="space-y-3">
              {mockTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center pb-3 border-b border-line last:border-b-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-ink font-medium">{transaction.job}</p>
                    <p className="text-line text-sm">{transaction.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg text-mint">
                      +${transaction.amount}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded text-center ${
                        transaction.status === 'completed'
                          ? 'bg-mint/20 text-mint'
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}
                    >
                      {transaction.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Payout Info */}
        <Card className="bg-panel">
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-ink">Payout Information</h2>
            <div className="space-y-3 text-line">
              <div>
                <p className="text-sm">Current Balance</p>
                <p className="text-ink font-medium text-lg">$450.00</p>
              </div>
              <div>
                <p className="text-sm">Next Payout</p>
                <p className="text-ink font-medium">September 30, 2026</p>
              </div>
              <div>
                <p className="text-sm">Payout Method</p>
                <p className="text-ink font-medium">Bank Transfer (ends in 4242)</p>
              </div>
            </div>
            <button className="text-mint hover:text-mint/80 text-sm font-medium mt-4">
              Update Payout Method
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
