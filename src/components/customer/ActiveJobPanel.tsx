'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import Link from 'next/link';
import { 
  Check, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  FileText, 
  ChevronRight,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { VerificationBadge } from './VerificationBadge';

export type JobRailState = 
  | 'REQUEST' 
  | 'ASSIGNED' 
  | 'ON_THE_WAY' 
  | 'ARRIVED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED';

export interface ActiveJobData {
  id: string;
  referenceNumber: string;
  serviceTitle: string;
  category: string;
  propertyName: string;
  propertyAddress: string;
  currentState: string;
  scheduledTime?: string;
  etaMinutes?: number;
  hasPendingQuote?: boolean;
  pendingQuoteTotal?: number;
  professional?: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
    rating: number;
    completedJobs: number;
    verificationStatus: 'verified' | 'pending' | 'not_verified';
  };
}

interface ActiveJobPanelProps {
  job: ActiveJobData | null;
  onOpenQuoteDrawer?: () => void;
  className?: string;
}

const RAIL_STEPS: { id: JobRailState; label: string; subLabel: string }[] = [
  { id: 'REQUEST', label: 'Request', subLabel: 'Logged' },
  { id: 'ASSIGNED', label: 'Assigned', subLabel: 'Expert matched' },
  { id: 'ON_THE_WAY', label: 'On way', subLabel: 'En route' },
  { id: 'ARRIVED', label: 'Arrived', subLabel: 'On site' },
  { id: 'IN_PROGRESS', label: 'Work', subLabel: 'Repairing' },
  { id: 'COMPLETED', label: 'Complete', subLabel: 'Verified' },
];

function mapDbStateToRail(state: string): JobRailState {
  const normalized = (state || '').toUpperCase();
  if (normalized.includes('COMPLETE') || normalized.includes('CLOSED')) return 'COMPLETED';
  if (normalized.includes('PROGRESS') || normalized.includes('WORK') || normalized.includes('INSPECTION') || normalized.includes('APPROVAL')) return 'IN_PROGRESS';
  if (normalized.includes('ARRIV')) return 'ARRIVED';
  if (normalized.includes('WAY') || normalized.includes('ROUTE')) return 'ON_THE_WAY';
  if (normalized.includes('ASSIGN') || normalized.includes('ACCEPT')) return 'ASSIGNED';
  return 'REQUEST';
}

export function ActiveJobPanel({ job, onOpenQuoteDrawer, className = '' }: ActiveJobPanelProps) {
  // If no job is provided, show calm reassuring state
  const currentRailState = job ? mapDbStateToRail(job.currentState) : 'REQUEST';
  const [simulatedState, setSimulatedState] = useState<JobRailState>(currentRailState);

  // Sync with prop when job updates
  useEffect(() => {
    if (job) {
      setSimulatedState(mapDbStateToRail(job.currentState));
    }
  }, [job]);

  const activeIndex = RAIL_STEPS.findIndex((s) => s.id === simulatedState);
  const progressPercent = activeIndex >= 0 ? (activeIndex / (RAIL_STEPS.length - 1)) * 100 : 0;

  // Refs for Anime.js
  const progressLineRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  // Animate state transition with Anime.js (350-500ms ease-out)
  useEffect(() => {
    if (progressLineRef.current) {
      animate(progressLineRef.current, {
        width: `${progressPercent}%`,
        duration: 450,
        ease: 'outQuad',
      });
    }

    if (markerRef.current) {
      animate(markerRef.current, {
        scale: [0.8, 1.15, 1],
        duration: 400,
        ease: 'outBack',
      });
    }
  }, [progressPercent, simulatedState]);

  if (!job) {
    return (
      <div className={`bg-[#FFFEFA] border border-[#D9DED8] rounded-[22px] p-6 shadow-[0_4px_24px_rgba(24,33,31,0.03)] ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7C8681]">ACTIVE WORK</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E2EEE9] text-[#176B5B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176B5B]"></span>
            All clear
          </span>
        </div>
        <h3 className="text-lg font-bold text-[#18211F] mb-1">No active repairs in progress</h3>
        <p className="text-sm text-[#5A6661] max-w-md mb-4">
          All systems for your properties are operating normally. When something requires inspection or repair, live status will track here.
        </p>
        <Link
          href="/customer/properties"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B5B] hover:text-[#0D5144] tracking-wide"
        >
          <span>View property records</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const pro = job.professional;

  return (
    <article 
      aria-label="Active service job progress"
      className={`bg-[#18211F] text-white rounded-[24px] p-6 sm:p-7 relative overflow-hidden shadow-[0_20px_50px_rgba(24,33,31,0.14)] ${className}`}
    >
      {/* Subtle ambient circle */}
      <div 
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full border border-white/[0.07] bg-white/[0.01]" 
      />

      {/* Top Bar: Reference & Status Pill */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
              ACTIVE REPAIR · {job.referenceNumber || 'FX-JOB'}
            </span>
            <span className="text-xs text-white/30">|</span>
            <span className="text-xs text-[#E7BE78] font-medium">{job.category || 'Maintenance'}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {job.serviceTitle}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-white/60">
            <MapPin className="w-3.5 h-3.5 text-[#72D0B7]" />
            <span>{job.propertyName}</span>
            {job.propertyAddress && (
              <>
                <span className="text-white/30">·</span>
                <span className="truncate max-w-[220px]">{job.propertyAddress}</span>
              </>
            )}
          </div>
        </div>

        {/* ETA Badge */}
        <div className="flex flex-col items-end">
          <div className="px-3 py-1.5 rounded-full border border-[#E7BE78]/30 bg-[#E7BE78]/10 text-[#E7BE78] text-xs font-bold tracking-wide flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {simulatedState === 'ON_THE_WAY' && (job.etaMinutes ? `ETA ~${job.etaMinutes} mins` : 'ETA ~14 mins')}
              {simulatedState === 'ARRIVED' && 'Arrived on site'}
              {simulatedState === 'IN_PROGRESS' && 'Work underway'}
              {simulatedState === 'COMPLETED' && 'Job verified complete'}
              {simulatedState === 'ASSIGNED' && 'Confirmed for appointment'}
              {simulatedState === 'REQUEST' && 'Matching technician'}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal State Rail (Anime.js animated) */}
      <div className="relative z-10 my-7 pt-2">
        <div className="relative">
          {/* Base Track */}
          <div className="absolute left-[3%] right-[3%] top-3 h-[3px] bg-white/10 rounded-full" />
          
          {/* Animated Fill Track */}
          <div 
            ref={progressLineRef}
            className="absolute left-[3%] top-3 h-[3px] bg-gradient-to-r from-[#72D0B7] to-[#E7BE78] rounded-full transition-none"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Rail Steps */}
          <div className="relative flex justify-between">
            {RAIL_STEPS.map((step, idx) => {
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setSimulatedState(step.id)}
                  title={`Click to preview state: ${step.label}`}
                  className="flex flex-col items-center group cursor-pointer text-left focus:outline-none"
                >
                  {/* Step Marker */}
                  <div
                    ref={isCurrent ? markerRef : undefined}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isPast
                        ? 'bg-[#72D0B7] border-[#72D0B7] text-[#18211F] shadow-[0_0_0_4px_rgba(114,208,183,0.15)]'
                        : isCurrent
                        ? 'bg-[#E7BE78] border-[#E7BE78] text-[#18211F] ring-4 ring-[#E7BE78]/20 ring-offset-2 ring-offset-[#18211F] scale-110'
                        : 'bg-[#18211F] border-white/25 text-white/40 group-hover:border-white/50'
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2.5 text-center">
                    <span 
                      className={`block text-[11px] font-bold tracking-tight transition-colors ${
                        isCurrent 
                          ? 'text-[#E7BE78]' 
                          : isPast 
                          ? 'text-white' 
                          : 'text-white/40'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="hidden sm:block text-[9px] text-white/40">
                      {step.subLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quote Approval Alert Banner (High Urgency) */}
      {(job.hasPendingQuote || simulatedState === 'IN_PROGRESS') && onOpenQuoteDrawer && (
        <div className="relative z-10 my-4 p-4 rounded-xl bg-gradient-to-r from-[#9B6A1E]/30 to-[#9B6A1E]/10 border border-[#E7BE78]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E7BE78] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#E7BE78] uppercase tracking-wider">
                Extra Work Authorization Requested
              </p>
              <p className="text-xs text-white/80 mt-0.5">
                Pro identified additional required repairs ({job.pendingQuoteTotal ? formatCurrency(job.pendingQuoteTotal) : formatCurrency(108.00)}). Review line items to proceed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenQuoteDrawer}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#E7BE78] hover:bg-[#d8b069] text-[#18211F] text-xs font-bold rounded-[10px] shadow-md transition-all flex-shrink-0"
          >
            <span>Review Quote</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer: Professional Card & Quick Actions */}
      <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Pro Details */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E2EEE9] text-[#176B5B] flex items-center justify-center font-bold text-sm border-2 border-white/20">
            {pro?.avatarUrl ? (
              <img src={pro.avatarUrl} alt={pro.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              pro?.name ? pro.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'FX'
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">
                {pro?.name || 'Assigned Certified Professional'}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#72D0B7]" />
            </div>
            <div className="text-[11px] text-white/50 flex items-center gap-2 mt-0.5">
              <span>★ {pro?.rating ? pro.rating.toFixed(1) : '4.9'} rating</span>
              <span>·</span>
              <span>{pro?.completedJobs ?? 48} jobs completed</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {pro?.phone && (
            <a
              href={`tel:${pro.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-[10px] border border-white/10 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#72D0B7]" />
              <span className="hidden sm:inline">Call</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => alert(`Starting secure message thread with ${pro?.name || 'Professional'}`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-[10px] border border-white/10 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#72D0B7]" />
            <span>Message</span>
          </button>

          <Link
            href={`/customer/bookings/${job.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#176B5B] hover:bg-[#0D5144] text-white text-xs font-bold rounded-[10px] transition-colors"
          >
            <span>Full details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
