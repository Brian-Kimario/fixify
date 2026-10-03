'use client';

import Link from 'next/link';
import { PRIORITY_COLORS, STATUS_COLORS, SUPPORT_CATEGORIES, type SupportTicket } from '@/lib/data/support-tickets';

interface TicketCardProps {
  ticket: SupportTicket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const timeSinceCreated = Math.floor((Date.now() - ticket.createdAt.getTime()) / 60000); // minutes
  const timeDisplay =
    timeSinceCreated < 60 ? `${timeSinceCreated}m ago` : `${Math.floor(timeSinceCreated / 60)}h ago`;

  const category = SUPPORT_CATEGORIES[ticket.category];
  const priorityColor = PRIORITY_COLORS[ticket.priority];
  const statusColor = STATUS_COLORS[ticket.status];

  return (
    <Link
      href={`/support/${ticket.id}`}
      className="block rounded-xl border border-line bg-paper p-5 transition hover:border-teal hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Header row: ticket number and status */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-ink-4">{ticket.ticketNumber}</span>
            <span className={`inline-flex rounded-full px-2 py-1 font-mono text-[10px] font-bold uppercase ${statusColor}`}>
              {ticket.status.replace('-', ' ')}
            </span>
          </div>

          {/* Subject */}
          <h3 className="mt-2 truncate font-semibold text-ink">{ticket.subject}</h3>

          {/* Customer and category */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-3">
            <span>{ticket.customerName}</span>
            <span className="text-ink-4">•</span>
            <div className="flex items-center gap-1">
              <span aria-hidden="true">{category.icon}</span>
              <span>{category.label}</span>
            </div>
          </div>

          {/* Tags */}
          {ticket.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {ticket.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="inline-flex rounded-full bg-teal-wash px-2 py-1 text-xs font-medium text-teal">
                  {tag}
                </span>
              ))}
              {ticket.tags.length > 2 && (
                <span className="text-xs text-ink-4">+{ticket.tags.length - 2} more</span>
              )}
            </div>
          )}
        </div>

        {/* Right side: priority and time */}
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex rounded-full px-2 py-1 font-mono text-[10px] font-bold uppercase ${priorityColor}`}>
            {ticket.priority}
          </span>
          <span className="text-xs text-ink-4">{timeDisplay}</span>
        </div>
      </div>
    </Link>
  );
}
