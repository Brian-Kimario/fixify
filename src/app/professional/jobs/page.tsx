import { getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';

export const metadata = {
  title: 'Available Jobs - Fixify Professional',
};

// Mock jobs data - will be replaced with database queries
const mockJobs = [
  {
    id: '1',
    title: 'Fix Leaky Kitchen Faucet',
    description: 'Kitchen faucet dripping constantly. Need quick fix.',
    category: 'Plumbing',
    budget: 150,
    location: 'Downtown',
    posted_at: '2 hours ago',
    bids_count: 3,
  },
  {
    id: '2',
    title: 'Paint Living Room Walls',
    description: 'Three walls need repainting. Prefer light gray color.',
    category: 'Painting',
    budget: 400,
    location: 'Midtown',
    posted_at: '4 hours ago',
    bids_count: 5,
  },
  {
    id: '3',
    title: 'Fix Broken Door Lock',
    description: 'Front door lock not functioning. Needs replacement.',
    category: 'Locksmith',
    budget: 200,
    location: 'Downtown',
    posted_at: '1 day ago',
    bids_count: 2,
  },
  {
    id: '4',
    title: 'Bathroom Tile Installation',
    description: 'Install new tiles in bathroom. 50 sq ft area.',
    category: 'Tile Work',
    budget: 800,
    location: 'Uptown',
    posted_at: '2 days ago',
    bids_count: 8,
  },
];

export default async function JobsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-4xl text-ink mb-2">
            Available Jobs
          </h1>
          <p className="text-line text-lg">
            Browse and bid on opportunities that match your skills
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-panel">
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-ink">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-ink text-sm font-medium mb-2">
                  Category
                </label>
                <select className="w-full px-3 py-2 bg-dark border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-mint">
                  <option>All Categories</option>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Painting</option>
                  <option>Carpentry</option>
                  <option>HVAC</option>
                </select>
              </div>
              <div>
                <label className="block text-ink text-sm font-medium mb-2">
                  Budget
                </label>
                <select className="w-full px-3 py-2 bg-dark border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-mint">
                  <option>Any Budget</option>
                  <option>Under $200</option>
                  <option>$200 - $500</option>
                  <option>$500 - $1000</option>
                  <option>Over $1000</option>
                </select>
              </div>
              <div>
                <label className="block text-ink text-sm font-medium mb-2">
                  Location
                </label>
                <select className="w-full px-3 py-2 bg-dark border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-mint">
                  <option>All Locations</option>
                  <option>Downtown</option>
                  <option>Midtown</option>
                  <option>Uptown</option>
                  <option>Suburbs</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="primary" size="sm" className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Jobs List */}
        <div className="space-y-4">
          {mockJobs.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-line text-lg">No jobs available at the moment</p>
                <p className="text-line text-sm mt-2">Check back soon for new opportunities</p>
              </div>
            </Card>
          ) : (
            mockJobs.map((job) => (
              <Card key={job.id}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/pro/jobs/${job.id}`}>
                          <h3 className="font-display font-bold text-xl text-ink hover:text-mint transition-colors">
                            {job.title}
                          </h3>
                        </Link>
                        <div className="flex gap-3 mt-2 flex-wrap">
                          <span className="inline-block px-2 py-1 bg-mint/10 text-mint text-xs rounded font-medium">
                            {job.category}
                          </span>
                          <span className="inline-block px-2 py-1 bg-line/10 text-line text-xs rounded">
                            {job.location}
                          </span>
                          <span className="inline-block text-line text-xs">
                            {job.posted_at}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-2xl text-mint">
                          ${job.budget}
                        </div>
                        <p className="text-line text-xs mt-1">
                          {job.bids_count} bids
                        </p>
                      </div>
                    </div>
                    <p className="text-line">
                      {job.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-line">
                  <Link href={`/pro/jobs/${job.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/pro/jobs/${job.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Submit Bid
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
