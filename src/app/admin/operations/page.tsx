'use client';

/**
 * /admin/operations — Dedicated operations queue page
 *
 * Displays all cases needing admin attention with filterable queue and slide-over drawer.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchNeedsAttention, type AttentionItem } from '@/app/admin/actions';
import { OperationsQueue } from '@/components/admin/OperationsQueue';
import { CaseDrawer } from '@/components/admin/CaseDrawer';

export default function OperationsPage() {
  const [cases, setCases] = useState<AttentionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<AttentionItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'dispute' | 'reassignment' | 'verification' | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'high' | 'medium' | 'low' | 'all'>('all');

  const loadCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchNeedsAttention({
        type: typeFilter === 'all' ? undefined : (typeFilter as 'dispute' | 'reassignment' | 'verification'),
        priority: priorityFilter === 'all' ? undefined : (priorityFilter as 'high' | 'medium' | 'low'),
      });

      if (result.success && result.data) {
        setCases(result.data);
      } else {
        setError(result.error || 'Failed to load cases');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, priorityFilter]);

  // Load cases on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const handleSelectCase = (item: AttentionItem) => {
    setSelectedCase(item);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedCase(null);
  };

  const handleActionSuccess = () => {
    // Refresh the list after action succeeds
    loadCases();
  };

  return (
    <div className="px-4 md:px-6 py-6 md:py-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-2">
          ADMIN · OPERATIONS
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#18211F] mb-2">Operations Queue</h1>
        <p className="text-[#5A6661]">Manage exceptions and operational decisions.</p>
        <Link href="/admin/operations/unmatched" className="mt-2 inline-block text-sm font-semibold text-teal hover:underline">
          Unmatched bookings →
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#7C8681] mb-2">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              loadCases();
            }}
            className="w-full px-3 py-2.5 border border-[#D9DED8] rounded-lg text-sm bg-white text-[#18211F] focus:outline-none focus:ring-2 focus:ring-[#176B5B]"
          >
            <option value="all">All Cases</option>
            <option value="dispute">Disputes</option>
            <option value="reassignment">Reassignments</option>
            <option value="verification">Verifications</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#7C8681] mb-2">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as any);
              loadCases();
            }}
            className="w-full px-3 py-2.5 border border-[#D9DED8] rounded-lg text-sm bg-white text-[#18211F] focus:outline-none focus:ring-2 focus:ring-[#176B5B]"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={loadCases}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-[#176B5B] bg-[#E2EEE9] hover:bg-[#D0E5E0] disabled:opacity-50 rounded-lg transition-colors"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div>
        {error && (
          <div className="bg-[#FDF5F3] border border-[#D9534F] rounded-lg p-4 mb-6 text-sm text-[#D9534F]">
            {error}
          </div>
        )}

        <OperationsQueue
          items={cases}
          isLoading={isLoading}
          onSelectCase={handleSelectCase}
        />
      </div>

      {/* Drawer */}
      <CaseDrawer
        isOpen={isDrawerOpen}
        case={selectedCase}
        onClose={handleDrawerClose}
        onActionSuccess={handleActionSuccess}
      />
    </div>
  );
}
