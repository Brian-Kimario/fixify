'use client';

/**
 * CaseTimeline — Vertical audit event timeline
 *
 * Shows each event: dot (colored by type), connecting line, card with timestamp/actor/description
 */

interface TimelineEvent {
  id?: string;
  type: 'state_change' | 'admin_action' | 'customer_action' | 'system_event' | 'error';
  timestamp: string;
  actor: string;
  description: string;
}

interface CaseTimelineProps {
  events: TimelineEvent[];
}

function getEventColor(type: TimelineEvent['type']) {
  const colors = {
    state_change: { dot: 'bg-[#176B5B]', icon: '✓' },
    admin_action: { dot: 'bg-[#A9523D]', icon: '⚙' },
    customer_action: { dot: 'bg-[#416B84]', icon: '👤' },
    system_event: { dot: 'bg-[#9B6A1E]', icon: '⊕' },
    error: { dot: 'bg-[#D9534F]', icon: '!' },
  };
  return colors[type];
}

function formatTimestamp(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CaseTimeline({ events }: CaseTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-[#999]">
        <p className="text-sm">No events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const colors = getEventColor(event.type);
        const isLast = idx === events.length - 1;

        return (
          <div key={event.id || idx} className="relative flex gap-4 pb-4">
            {/* Left column: dot + line */}
            <div className="relative flex flex-col items-center">
              {/* Dot */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${colors.dot}`}
              >
                {colors.icon}
              </div>
              {/* Connecting line (if not last event) */}
              {!isLast && (
                <div className="absolute top-6 left-3 w-0.5 h-12 bg-[#E8E6E0]" />
              )}
            </div>

            {/* Right column: event details */}
            <div className="pt-0.5 flex-1">
              <div className="text-xs text-[#999] font-mono mb-1">
                {formatTimestamp(event.timestamp)}
              </div>
              <div className="text-xs font-bold text-[#18211F] mb-0.5">{event.actor}</div>
              <div className="text-sm text-[#18211F] leading-relaxed">{event.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
