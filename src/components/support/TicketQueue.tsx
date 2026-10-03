'use client';

import { useState } from 'react';
import { getOpenTickets, getEscalations, type TicketCategory, SUPPORT_CATEGORIES } from '@/lib/data/support-tickets';
import { TicketCard } from './TicketCard';

type QueueFilter = 'all-open' | 'escalations' | 'by-category';

interface TicketQueueProps {
  defaultFilter?: QueueFilter;
}

export function TicketQueue({ defaultFilter = 'all-open' }: TicketQueueProps) {
  const [filter, setFilter] = useState<QueueFilter>(defaultFilter);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory>('booking');

  let tickets = getOpenTickets();

  if (filter === 'escalations') {
    tickets = getEscalations();
  } else if (filter === 'by-category') {
    tickets = tickets.filter((t) => t.category === selectedCategory);
  }

  const sortedTickets = [...tickets].sort((a, b) => {
    // Sort by: priority (critical first), then by creation date (newest first)
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-4">
        <button
          onClick={() => setFilter('all-open')}
          className={`rounded-lg px-4 py-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
            filter === 'all-open'
              ? 'bg-teal text-white'
              : 'bg-porcelain text-ink-2 hover:bg-paper'
          }`}
          aria-pressed={filter === 'all-open'}
        >
          All Open ({getOpenTickets().length})
        </button>
        <button
          onClick={() => setFilter('escalations')}
          className={`rounded-lg px-4 py-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
            filter === 'escalations'
              ? 'bg-danger text-white'
              : 'bg-danger-soft text-danger hover:bg-danger-soft/80'
          }`}
          aria-pressed={filter === 'escalations'}
        >
          🔴 Escalations ({getEscalations().length})
        </button>
      </div>

      {/* Category selector (shown when by-category filter is active) */}
      {filter === 'by-category' && (
        <div className="flex flex-wrap gap-2">
          {(Object.entries(SUPPORT_CATEGORIES) as Array<[TicketCategory, (typeof SUPPORT_CATEGORIES)[TicketCategory]]>).map(
            ([categoryKey, category]) => (
              <button
                key={categoryKey}
                onClick={() => setSelectedCategory(categoryKey)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                  selectedCategory === categoryKey
                    ? 'bg-teal text-white'
                    : 'bg-porcelain text-ink-2 hover:bg-paper'
                }`}
                aria-pressed={selectedCategory === categoryKey}
              >
                <span aria-hidden="true">{category.icon}</span>
                <span className="text-sm font-semibold">{category.label}</span>
              </button>
            )
          )}
        </div>
      )}

      {/* Ticket list */}
      <div className="space-y-3">
        {sortedTickets.length === 0 ? (
          <div className="rounded-lg border border-line bg-porcelain p-8 text-center">
            <p className="text-ink-3">
              {filter === 'escalations'
                ? 'No escalations at the moment. Great work!'
                : 'No open tickets. You\'re all caught up!'}
            </p>
          </div>
        ) : (
          sortedTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
        )}
      </div>

      {/* Info text */}
      <p className="text-xs text-ink-4">
        Tickets are automatically prioritized by severity and age. Click any ticket to view details and respond.
      </p>
    </div>
  );
}
