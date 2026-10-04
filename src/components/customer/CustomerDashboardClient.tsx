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
  Bell,
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
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

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
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: string | null;
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
  isLoading = false,
  isEmpty = false,
  error = null,
}: CustomerDashboardClientProps) {
  const [isQuoteDrawerOpen, setIsQuoteDrawerOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<ActiveJobData | null>(activeJob);

  // If a quote was approved or declined in the drawer
  const handleQuoteDecision = (decision: 'approved' | 'declined') => {
    if (currentJob) {
      setCurrentJob({
        ...currentJob,
        hasPendingQuote: false,
        currentState: decision === 'approved' ? 'IN_PROGRESS' : currentJob.currentState,
      });
    }
  };

  const primaryProperty = properties[0];

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#18211F]">
      {/* ── Fixed/Sticky Top Navigation Bar ── */}
      <header className="sticky top-0 z-30 bg-[#F7F4EC]/90 backdrop-blur-md border-b border-[#D9DED8]/80">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7C8681] block">
              YOUR RESIDENTIAL RECORD
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18211F] mt-0.5">
              {greeting}, {displayName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Property Switcher or Indicator */}
            {primaryProperty && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D9DED8] bg-[#FFFEFA] text-xs font-semibold text-[#18211F]">
                <Building2 className="w-3.5 h-3.5 text-[#176B5B]" />
                <span>{primaryProperty.name}</span>
              </div>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              className="w-10 h-10 rounded-xl border border-[#D9DED8] bg-[#FFFEFA] text-[#5A6661] hover:text-[#18211F] hover:border-[#BCD4CC] flex items-center justify-center relative transition-all"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingQuote && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#9B6A1E] ring-2 ring-[#FFFEFA]" />
              )}
            </button>

            {/* User Initials Avatar */}
            <Link
              href="/customer/profile"
              className="w-10 h-10 rounded-xl bg-[#18211F] text-white flex items-center justify-center text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
              title="Open profile"
            >
              {displayName.slice(0, 2).toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Surface ── */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* State management: Show loading/error/empty states */}
        {isLoading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {isEmpty && !isLoading && !error && <EmptyState />}
        
        {/* Normal content render (when data is loaded and not empty) */}
        {!isLoading && !error && !isEmpty && (
          <>
            {/* ── AREA 1: ABOVE THE FOLD DOMAIN ZONE ── */}
            <section aria-label="Active workspace and immediate intake" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Active Job Panel (High Urgency: dominates above fold, ~60% width) */}
              <div className="lg:col-span-7 space-y-6">
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
              <div className="lg:col-span-5 space-y-6">
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
                        {primaryProperty?.name || 'Oakwood Residence'}
                      </h3>
                      <p className="text-xs text-white/80 mt-0.5">
                        {primaryProperty?.addressLine1 ? `${primaryProperty.addressLine1}, ${primaryProperty.city}` : '1428 Elm Creek Road · Single Family'}
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
                          {timelineEvents.length || 14}
                        </strong>
                        <span className="text-[10px] text-[#176B5B] font-semibold mt-0.5 block">All logged</span>
                      </div>

                      <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#D9DED8]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8681] block">
                          WARRANTY STATUS
                        </span>
                        <strong className="text-xl font-bold text-[#176B5B] mt-0.5 block">
                          Active
                        </strong>
                        <span className="text-[10px] text-[#5A6661] mt-0.5 block">Fixify 12-Mo Guarantee</span>
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
