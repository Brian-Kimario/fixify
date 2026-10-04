'use client';

/**
 * OperationsQueue — Table view of admin cases needing attention
 *
 * Desktop: HTML table with type badge, case ID, participants, status, created time
 * Mobile: Card stack (one case per card, scrollable)
 *
 * Props:
 *   items: AttentionItem[] — cases to display
 *   isLoading: boolean — show skeleton rows while loading
 *   onSelectCase: (item) => void — click handler to open drawer
 */

import React from 'react';
import type { AttentionItem } from '@/app/admin/actions';

interface OperationsQueueProps {
  items: AttentionItem[];
  isLoading?: boolean;
  onSelectCase?: (item: AttentionItem) => void;
}

// Type badge styling
function getTypeBadge(type: 'dispute' | 'reassignment' | 'verification') {
  const styles: Record<typeof type, { label: string; cls: string }> = {
    dispute: {
      label: 'Dispute',
      cls: 'bg-[#F3E1DA] text-[#A9523D] border border-[#DFC0B7]',
    },
    reassignment: {
      label: 'Reassignment',
      cls: 'bg-[#E6EEF2] text-[#416B84] border border-[#BCD0DB]',
    },
    verification: {
      label: 'Verification',
      cls: 'bg-[#C7DCCF] text-[#2F7D5B] border border-[#B0C9B8]',
    },
  };
  const s = styles[type];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

// Priority badge styling
function getPriorityBadge(priority: 'high' | 'medium' | 'low') {
  const styles = {
    high: { label: 'High', cls: 'bg-[#F3E1DA] text-[#A9523D]' },
    medium: { label: 'Medium', cls: 'bg-[#F5EBD7] text-[#9B6A1E]' },
    low: { label: 'Low', cls: 'bg-[#E6EEF2] text-[#416B84]' },
  };
  const s = styles[priority];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

// Format relative time ("2h ago", "3d ago", etc.)
function formatRelativeTime(isoStr: string): string {
  const date = new Date(isoStr);
  const now = new Date();
  const ms = now.getTime() - date.getTime();

  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

// Skeleton row for loading state
function SkeletonRow() {
  return (
    <tr className="border-b border-[#E8E6E0] hover:bg-[#FAFAF8]">
      <td className="px-4 py-3">
        <div className="h-6 w-16 bg-[#E8E6E0] rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 bg-[#E8E6E0] rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-32 bg-[#E8E6E0] rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 bg-[#E8E6E0] rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-16 bg-[#E8E6E0] rounded animate-pulse" />
      </td>
    </tr>
  );
}

// Mobile card view
function CaseCard({ item, onSelect }: { item: AttentionItem; onSelect?: (item: AttentionItem) => void }) {
  return (
    <button
      onClick={() => onSelect?.(item)}
      className="w-full bg-white rounded-lg border border-[#E8E6E0] p-4 text-left hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-1">
            {getTypeBadge(item.type)}
            {getPriorityBadge(item.priority)}
          </div>
          <h3 className="text-sm font-bold text-[#18211F]">{item.label}</h3>
          <p className="text-xs text-[#666] mt-1">{item.sub}</p>
        </div>
      </div>
      <p className="text-xs text-[#999]">{formatRelativeTime(item.createdAt)}</p>
    </button>
  );
}

export function OperationsQueue({
  items,
  isLoading = false,
  onSelectCase,
}: OperationsQueueProps) {
  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-[#E8E6E0] p-8 text-center">
        <div className="text-[#999] text-sm">
          <p className="font-medium">All caught up</p>
          <p className="text-xs mt-1">No cases need attention right now</p>
        </div>
      </div>
    );
  }

  // Desktop table view (hidden on mobile)
  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block w-full bg-white rounded-lg border border-[#E8E6E0] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F7F4EC] border-b border-[#E8E6E0]">
              <th className="px-4 py-3 text-left font-bold text-[#18211F]">Type</th>
              <th className="px-4 py-3 text-left font-bold text-[#18211F]">Case ID</th>
              <th className="px-4 py-3 text-left font-bold text-[#18211F]">Details</th>
              <th className="px-4 py-3 text-left font-bold text-[#18211F]">Priority</th>
              <th className="px-4 py-3 text-left font-bold text-[#18211F]">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectCase?.(item)}
                    className="border-b border-[#E8E6E0] hover:bg-[#FAFAF8] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">{getTypeBadge(item.type)}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-[#666]">{item.id.slice(0, 12)}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-[#18211F]">{item.label}</div>
                      <div className="text-xs text-[#999]">{item.sub}</div>
                    </td>
                    <td className="px-4 py-3">{getPriorityBadge(item.priority)}</td>
                    <td className="px-4 py-3 text-xs text-[#999]">
                      {formatRelativeTime(item.createdAt)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card stack */}
      <div className="md:hidden space-y-3 w-full">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-[#E8E6E0] p-4 space-y-2">
                <div className="h-6 w-16 bg-[#E8E6E0] rounded animate-pulse" />
                <div className="h-4 w-full bg-[#E8E6E0] rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-[#E8E6E0] rounded animate-pulse" />
              </div>
            ))
          : items.map((item) => <CaseCard key={item.id} item={item} onSelect={onSelectCase} />)}
      </div>
    </>
  );
}
