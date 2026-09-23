import { getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';

export const metadata = {
  title: 'My Bids - Fixify Professional',
};

// Mock bids data - will be replaced with database queries
const mockBids = [
  {
    id: '1',
    job_title: 'Fix Leaky Kitchen Faucet',
    bid_amount: 150,
    status: 'pending',
    submitted_at: '2 hours ago',
    customer: 'John Smith',
    customer_rating: 4.8,
  },
  {
    id: '2',
    job_title: 'Paint Living Room Walls',
    bid_amount: 350,
    status: 'accepted',
    submitted_at: '1 day ago',
    customer: 'Sarah Johnson',
    customer_rating: 5.0,
  },
  {
    id: '3',
    job_title: 'Fix Broken Door Lock',
    bid_amount: 200,
    status: 'declined',
    submitted_at: '3 days ago',
    customer: 'Mike Chen',
    customer_rating: 4.5,
  },
  {
    id: '4',
    job_title: 'Bathroom Tile Installation',
    bid_amount: 750,
    status: 'pending',
    submitted_at: '2 days ago',
    customer: 'Emma Davis',
    customer_rating: 4.9,
  },
];

function getBidStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-500';
    case 'accepted':
      return 'bg-mint/20 text-mint';
    case 'declined':
      return 'bg-red-500/20 text-red-500';
    case 'completed':
      return 'bg-blue-500/20 text-blue-500';
    default:
      return 'bg-line/10 text-line';
  }
}

export default async function MyBidsPage() {
  const profile = await getCurrentProfile();

  const pendingBids = mockBids.filter((b) => b.status === 'pending').length;
  const acceptedBids = mockBids.filter((b) => b.status === 'accepted').length;
  const totalBids = mockBids.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-4xl text-ink mb-2">
            My Bids
          </h1>
          <p className="text-line text-lg">
            Track your proposals and manage accepted jobs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="space-y-2">
              <p className="text-line text-sm">Total Bids</p>
              <p className="font-display font-bold text-3xl text-ink">{totalBids}</p>
            </div>
          </Card>
          <Card>
            <div className="space-y-2">
              <p className="text-line text-sm">Pending Response</p>
              <p className="font-display font-bold text-3xl text-yellow-500">{pendingBids}</p>
            </div>
          </Card>
          <Card>
            <div className="space-y-2">
              <p className="text-line text-sm">Accepted Jobs</p>
              <p className="font-display font-bold text-3xl text-mint">{acceptedBids}</p>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card className="bg-panel">
          <div className="flex gap-4 flex-wrap">
            <button className="px-4 py-2 text-ink font-medium border-b-2 border-mint text-sm">
              All ({totalBids})
            </button>
            <button className="px-4 py-2 text-line hover:text-ink transition-colors font-medium text-sm">
              Pending ({pendingBids})
            </button>
            <button className="px-4 py-2 text-line hover:text-ink transition-colors font-medium text-sm">
              Accepted ({acceptedBids})
            </button>
            <button className="px-4 py-2 text-line hover:text-ink transition-colors font-medium text-sm">
              Declined
            </button>
          </div>
        </Card>

        {/* Bids List */}
        <div className="space-y-4">
          {mockBids.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-line text-lg">No bids yet</p>
                <p className="text-line text-sm mt-2">Start browsing jobs to submit your first bid</p>
                <Link href="/pro/jobs">
                  <Button variant="primary" size="sm" className="mt-4">
                    Browse Jobs
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            mockBids.map((bid) => (
              <Card key={bid.id}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display font-bold text-lg text-ink">
                          {bid.job_title}
                        </h3>
                        <span
                          className={`px-3 py-1 text-xs rounded font-medium capitalize ${getBidStatusBadge(
                            bid.status
                          )}`}
                        >
                          {bid.status}
                        </span>
                      </div>
                      <p className="text-line text-sm mt-2">
                        Customer: {bid.customer} •{' '}
                        <span className="inline-flex items-center gap-1">
                          ★ {bid.customer_rating}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-2xl text-mint">
                        ${bid.bid_amount}
                      </p>
                      <p className="text-line text-xs mt-1">{bid.submitted_at}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-line">
                    {bid.status === 'pending' && (
                      <>
                        <Button variant="secondary" size="sm" className="flex-1">
                          Withdraw Bid
                        </Button>
                        <Button variant="secondary" size="sm" className="flex-1">
                          Edit Proposal
                        </Button>
                      </>
                    )}
                    {bid.status === 'accepted' && (
                      <>
                        <Button variant="secondary" size="sm" className="flex-1">
                          Message Customer
                        </Button>
                        <Button variant="primary" size="sm" className="flex-1">
                          Start Job
                        </Button>
                      </>
                    )}
                    {bid.status === 'declined' && (
                      <Button variant="secondary" size="sm" className="flex-1">
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
