import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { Card, Button, Input, Label } from '@/components/ui';
import Link from 'next/link';
import { BidForm } from './BidForm';

export const metadata = {
  title: 'Job Details - Fixify Professional',
};

// Mock job details - will be replaced with database queries
const mockJobDetails = {
  id: '1',
  title: 'Fix Leaky Kitchen Faucet',
  description: 'Kitchen faucet dripping constantly. Need quick fix. The faucet is a standard two-handle model, approximately 5 years old. I believe it might just need a washer replacement, but I\'m open to suggestions.',
  category: 'Plumbing',
  budget: 150,
  location: 'Downtown',
  posted_at: '2 hours ago',
  bids_count: 3,
  customer: {
    name: 'John Smith',
    rating: 4.8,
    reviews: 12,
  },
  timeline: 'This week preferred',
  details: {
    property_type: 'Apartment',
    description: 'Kitchen faucet dripping constantly. Need quick fix.',
    urgency: 'Medium',
  },
};

interface JobDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <Card>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-display font-bold text-3xl text-ink mb-2">
                    {mockJobDetails.title}
                  </h1>
                  <div className="flex gap-3 flex-wrap">
                    <span className="inline-block px-3 py-1 bg-mint/10 text-mint text-sm rounded font-medium">
                      {mockJobDetails.category}
                    </span>
                    <span className="inline-block px-3 py-1 bg-line/10 text-line text-sm rounded">
                      {mockJobDetails.location}
                    </span>
                    <span className="inline-block text-line text-sm">
                      Posted {mockJobDetails.posted_at}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-3xl text-mint">
                    ${mockJobDetails.budget}
                  </div>
                  <p className="text-line text-sm mt-1">
                    {mockJobDetails.bids_count} bids already placed
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Job Description */}
          <Card>
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink">Job Details</h2>
              <p className="text-line leading-relaxed">
                {mockJobDetails.description}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line">
                <div>
                  <p className="text-line text-sm">Timeline</p>
                  <p className="text-ink font-medium">{mockJobDetails.timeline}</p>
                </div>
                <div>
                  <p className="text-line text-sm">Urgency</p>
                  <p className="text-ink font-medium">{mockJobDetails.details.urgency}</p>
                </div>
                <div>
                  <p className="text-line text-sm">Property Type</p>
                  <p className="text-ink font-medium">{mockJobDetails.details.property_type}</p>
                </div>
                <div>
                  <p className="text-line text-sm">Bids</p>
                  <p className="text-ink font-medium">{mockJobDetails.bids_count} placed</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Info */}
          <Card>
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink">About the Customer</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ink font-medium text-lg">{mockJobDetails.customer.name}</p>
                  <p className="text-line text-sm">Member since 2022</p>
                  <div className="flex gap-1 mt-2">
                    <span className="text-mint">★</span>
                    <span className="text-ink font-medium">{mockJobDetails.customer.rating}</span>
                    <span className="text-line text-sm">({mockJobDetails.customer.reviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Bid Form */}
        <div className="lg:col-span-1">
          <BidForm jobId={params.id} jobTitle={mockJobDetails.title} budget={mockJobDetails.budget} />
        </div>
      </div>
    </div>
  );
}
