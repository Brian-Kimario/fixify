'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  ProblemIntake, 
  ActiveJobPanel, 
  ActiveJobData, 
  PropertyMaintenanceTimeline, 
  TimelineEvent,
  QuoteApprovalPanel, 
  QuoteApprovalData,
  RecentActivityList,
  ActivityItem
} from '@/components/customer';
import { EmptyState } from './EmptyState';

interface PropertyItem {
  id: string;
  name: string;
  propertyType: string;
  addressLine1?: string;
  city?: string;
  jobCount?: number;
}

interface CustomerDashboardClientProps {
  displayName: string;
  greeting: string;
  userEmail?: string;
  activeJob: ActiveJobData | null;
  pendingQuote: QuoteApprovalData | null;
  properties: PropertyItem[];
  timelineEvents: TimelineEvent[];
  recentActivities: ActivityItem[];
  isEmpty?: boolean;
}

export function CustomerDashboardClient({
  displayName,
  greeting,
  userEmail,
  activeJob,
  pendingQuote,
  properties,
  timelineEvents,
  recentActivities,
  isEmpty = false,
}: CustomerDashboardClientProps) {
  const [isQuoteDrawerOpen, setIsQuoteDrawerOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<ActiveJobData | null>(activeJob);

  // respond_to_quote moves the job back to in_progress for both decisions
  const handleQuoteDecision = () => {
    if (currentJob) {
      setCurrentJob({ ...currentJob, hasPendingQuote: false, currentState: 'in_progress' });
    }
  };

  const primaryProperty = properties[0];

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#18211F]">
      {/* ── Page heading (global navigation and account menu live in the layout) ── */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7C8681] block">
            YOUR RESIDENTIAL RECORD
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18211F] mt-0.5 truncate">
            {greeting}, {displayName}
          </h1>
        </div>
        {primaryProperty && (
          <Link
            href="/customer/properties"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D9DED8] bg-[#FFFEFA] text-xs font-semibold text-[#18211F] hover:border-[#BCD4CC] transition"
          >
            <Building2 className="w-3.5 h-3.5 text-[#176B5B]" />
            <span>{primaryProperty.name}</span>
          </Link>
        )}
      </div>

      {/* ── Main Dashboard Surface ── */}
      <main id="main-content" className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* State management: Show empty state when appropriate */}
        {isEmpty && <EmptyState />}
        
        {/* Normal content render (when data is loaded and not empty) */}
        {!isEmpty && (
          <>
            {/* ── AREA 1: ABOVE THE FOLD DOMAIN ZONE ── */}
            <section aria-label="Active workspace and immediate intake" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Active Job Panel (High Urgency: dominates above fold, ~60% width) */}
              <div className="lg:col-span-2 space-y-8">
                <ActiveJobPanel
                  job={currentJob}
                  onOpenQuoteDrawer={() => setIsQuoteDrawerOpen(true)}
                />

                {/* Problem Intake (Custom domain component, not generic form) */}
                <ProblemIntake
                  properties={properties.map((p) => ({
                    id: p.id,
                    name: p.name,
                    address: p.addressLine1 ? `${p.addressLine1}, ${p.city}` : undefined,
                  }))}
                />
              </div>

              {/* Right Column: Property Record Snapshot & Recent Activity (40% width) */}
              <div className="lg:col-span-1 space-y-8">
                {/* Primary Property Record Card */}
                <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[22px] overflow-hidden shadow-[0_4px_24px_rgba(24,33,31,0.03)]">
                  <div className="h-36 bg-gradient-to-tr from-[#18211F] to-[#263b36] relative p-5 flex flex-col justify-end text-white overflow-hidden">
                    <div 
                      aria-hidden="true" 
                      className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80')` }}
                    />
                    <div className="relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 block mb-0.5">
                        PROPERTY RECORD
                      </span>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {primaryProperty?.name || 'Your property'}
                      </h3>
                      <p className="text-xs text-white/80 mt-0.5">
                        {primaryProperty?.addressLine1 ? `${primaryProperty.addressLine1}, ${primaryProperty.city}` : 'Add your property address'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#D9DED8]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8681] block">
                          VERIFIED REPAIRS
                        </span>
                        <strong className="text-xl font-bold text-[#18211F] mt-0.5 block">
                          {timelineEvents.length || 0}
                        </strong>
                        <span className="text-[10px] text-[#176B5B] font-semibold mt-0.5 block">All logged</span>
                      </div>

                      <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#D9DED8]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8681] block">
                          WARRANTY STATUS
                        </span>
                        <strong className={`text-xl font-bold mt-0.5 block ${
                          timelineEvents.length > 0 ? 'text-[#176B5B]' : 'text-[#7C8681]'
                        }`}>
                          {timelineEvents.length > 0 ? 'Active' : 'None'}
                        </strong>
                        <span className="text-[10px] text-[#5A6661] mt-0.5 block">
                          {timelineEvents.length > 0 ? `Until ${timelineEvents[0]?.warrantyValidUntil || 'date pending'}` : 'No repairs yet'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#D9DED8]/60">
                      <Link
                        href="/customer/properties"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B5B] hover:text-[#0D5144] tracking-wide"
                      >
                        <span>Manage all properties ({properties.length || 1})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        href="/customer/properties"
                        className="text-xs font-semibold text-[#5A6661] hover:text-[#18211F]"
                      >
                        Add home +
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Recent Activity List (Magic UI AnimatedList inspiration adapted) */}
                <RecentActivityList
                  activities={recentActivities}
                />

                {/* Support Callout */}
                <div className="p-5 rounded-[20px] bg-gradient-to-br from-[#E2EEE9] to-[#F1EEE5] border border-[#BCD4CC] flex items-center justify-between gap-4">
                  <div>
                    <strong className="text-sm font-bold text-[#18211F] block">
                      Questions about active work?
                    </strong>
                    <p className="text-xs text-[#5A6661] mt-0.5">
                      Keep communication tied to the job record for audit integrity.
                    </p>
                  </div>
                  <Link
                    href="/support"
                    className="px-3.5 py-2 rounded-xl bg-[#FFFEFA] border border-[#BCD4CC] text-xs font-bold text-[#176B5B] hover:bg-[#176B5B] hover:text-white transition-all flex-shrink-0"
                  >
                    Help Desk
                  </Link>
                </div>
              </div>
            </section>

            {/* ── AREA 2: PROPERTY MAINTENANCE TIMELINE (Aceternity Inspiration) ── */}
            <section aria-label="Property maintenance timeline">
              <PropertyMaintenanceTimeline
                events={timelineEvents}
              />
            </section>
          </>
        )}
      </main>

      {/* ── CONTEXTUAL SIDE DRAWER: QUOTE APPROVAL PANEL ── */}
      <QuoteApprovalPanel
        isOpen={isQuoteDrawerOpen}
        onClose={() => setIsQuoteDrawerOpen(false)}
        quote={pendingQuote}
        onDecisionCompleted={handleQuoteDecision}
      />
    </div>
  );
}
