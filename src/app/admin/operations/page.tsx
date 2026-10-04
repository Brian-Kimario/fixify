'use client';

/**
 * /admin/operations — Dedicated operations queue page
 *
 * Displays all cases needing admin attention with filterable queue and slide-over drawer.
 */

import React, { useState, useEffect } from 'react';
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

  // Load cases on mount
  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchNeedsAttention({
        type: typeFilter === 'all' ? undefined : typeFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
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
  };

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
    <div className="min-h-screen bg-[#F7F4EC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E0] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-[#18211F]">Operations Queue</h1>
          <p className="text-sm text-[#666] mt-1">Manage exceptions and operational decisions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-[#E8E6E0] sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row gap-4">
          {/* Type filter */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-[#999] mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                loadCases();
              }}
              className="w-full px-3 py-2 border border-[#E8E6E0] rounded text-sm bg-white"
            >
              <option value="all">All Cases</option>
              <option value="dispute">Disputes</option>
              <option value="reassignment">Reassignments</option>
              <option value="verification">Verifications</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-[#999] mb-2">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as any);
                loadCases();
              }}
              className="w-full px-3 py-2 border border-[#E8E6E0] rounded text-sm bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Refresh button */}
          <div className="flex items-end">
            <button
              onClick={loadCases}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-[#176B5B] bg-[#E6EEF2] hover:bg-[#D0E5E0] disabled:opacity-50 rounded transition-colors"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
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
