import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';

export const metadata = {
  title: 'Professional Profile - Fixify',
};

export default async function ProfessionalProfilePage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-display font-bold text-3xl text-ink mb-2">
                    {profile?.full_name || 'Your Profile'}
                  </h1>
                  <p className="text-line">Professional Service Provider</p>
                </div>
                <Link href="/pro/profile/edit">
                  <Button variant="secondary" size="sm">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* About Section */}
          <Card>
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink">About</h2>
              <p className="text-line leading-relaxed">
                Add a professional bio to help customers understand your experience and expertise. This helps increase bid acceptance rates.
              </p>
            </div>
          </Card>

          {/* Skills Section */}
          <Card>
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink">Skills</h2>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block px-3 py-1 bg-mint/20 text-mint rounded-lg text-sm font-medium">
                    Plumbing
                  </span>
                  <span className="inline-block px-3 py-1 bg-mint/20 text-mint rounded-lg text-sm font-medium">
                    Repairs
                  </span>
                  <span className="inline-block px-3 py-1 bg-mint/20 text-mint rounded-lg text-sm font-medium">
                    Maintenance
                  </span>
                  <button className="inline-block px-3 py-1 bg-line/10 text-line hover:bg-line/20 rounded-lg text-sm font-medium transition-colors">
                    + Add Skills
                  </button>
                </div>
                <p className="text-line text-sm">
                  Add skills to help customers find you for their specific needs
                </p>
              </div>
            </div>
          </Card>

          {/* Experience Section */}
          <Card>
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink">Experience</h2>
              <div className="space-y-4">
                {/* Placeholder experience item */}
                <div className="pb-4 border-b border-line last:border-b-0 last:pb-0">
                  <p className="text-ink font-medium">Handyman & Plumber</p>
                  <p className="text-line text-sm">Self-employed • 5+ years</p>
                  <p className="text-line text-sm mt-2">
                    Experienced in residential repairs and maintenance services
                  </p>
                </div>
              </div>
              <button className="text-mint hover:text-mint/80 text-sm font-medium">
                + Add Experience
              </button>
            </div>
          </Card>

          {/* Certifications Section */}
          <Card>
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink">Certifications</h2>
              <div className="space-y-3">
                <p className="text-line text-sm">
                  No certifications added yet. Add relevant credentials to boost your credibility.
                </p>
                <button className="text-mint hover:text-mint/80 text-sm font-medium">
                  + Add Certification
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Stats */}
          <Card>
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-ink">Profile Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-line text-sm">Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-mint">★★★★★</span>
                    <span className="text-ink font-medium">4.8</span>
                  </div>
                  <p className="text-line text-xs mt-1">Based on 12 reviews</p>
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-line text-sm">Jobs Completed</p>
                  <p className="text-ink font-bold text-xl mt-1">12</p>
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-line text-sm">Response Rate</p>
                  <p className="text-ink font-bold text-xl mt-1">95%</p>
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-line text-sm">Total Earnings</p>
                  <p className="text-mint font-bold text-xl mt-1">$9,450</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Info */}
          <Card>
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-ink">Contact Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-line text-sm">Email</p>
                  <p className="text-ink text-sm break-all">{user?.email}</p>
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-line text-sm">Phone</p>
                  <p className="text-ink text-sm">Not set</p>
                </div>
              </div>
              <Link href="/pro/profile/edit">
                <Button variant="secondary" size="sm" className="w-full">
                  Update Contact Info
                </Button>
              </Link>
            </div>
          </Card>

          {/* Verify Profile */}
          <Card className="bg-mint/10 border-mint/30">
            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-ink">Verify Your Profile</h3>
              <p className="text-line text-sm">
                Get a verified badge by completing background checks and ID verification.
              </p>
              <button className="text-mint hover:text-mint/80 text-sm font-medium">
                Start Verification
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
