import type { JobEvent } from '@/app/professional/types';

// Ordered list of states that form the progress rail
const PROGRESS_STATES = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'on_the_way', label: 'On the Way' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
] as const;

const STATE_COLORS: Record<string, { dot: string; line: string; text: string }> = {
  assigned:      { dot: 'bg-[#416B84]',  line: 'bg-[#BCD0DB]', text: 'text-[#416B84]' },
  accepted:      { dot: 'bg-[#176B5B]',  line: 'bg-[#B8D5CB]', text: 'text-[#176B5B]' },
  on_the_way:    { dot: 'bg-[#176B5B]',  line: 'bg-[#B8D5CB]', text: 'text-[#176B5B]' },
  arrived:       { dot: 'bg-[#176B5B]',  line: 'bg-[#B8D5CB]', text: 'text-[#176B5B]' },
  in_progress:   { dot: 'bg-[#9B6700]',  line: 'bg-[#E8D5A3]', text: 'text-[#9B6700]' },
  quote_pending: { dot: 'bg-[#A9523D]',  line: 'bg-[#DFC0B7]', text: 'text-[#A9523D]' },
  completed:     { dot: 'bg-[#2F7D5B]',  line: 'bg-[#C7DCCF]', text: 'text-[#2F7D5B]' },
  cancelled:     { dot: 'bg-[#9B3535]',  line: 'bg-[#DFC0C0]', text: 'text-[#9B3535]' },
  closed:        { dot: 'bg-[#7C8681]',  line: 'bg-[#D9DED8]', text: 'text-[#7C8681]' },
};

const LIVE_STATES = new Set(['on_the_way', 'arrived', 'in_progress', 'quote_pending']);

const EVENT_LABELS: Record<string, string> = {
  assigned:      'Job assigned to you',
  accepted:      'You accepted the job',
  on_the_way:    'You marked yourself on the way',
  arrived:       'You arrived at the property',
  in_progress:   'Work started',
  quote_pending: 'Quote sent to customer',
  completed:     'Job completed',
  cancelled:     'Job cancelled',
  closed:        'Job closed',
};

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface JobTimelineProps {
  currentState: string;
  events?: JobEvent[];
}

/**
 * JobTimeline — Visual job progress component
 *
 * Two sections:
 * 1. Progress Rail — horizontal step rail showing progression through standard states
 * 2. Event Log — chronological list of all recorded job_events
 */
export function JobTimeline({ currentState, events = [] }: JobTimelineProps) {
  const currentIndex = PROGRESS_STATES.findIndex((s) => s.key === currentState);
  const isCancelled = currentState === 'cancelled';

  return (
    <div className="space-y-6">
      {/* ── Progress Rail ── */}
      <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-5">Job Progress</p>

        <div className="overflow-x-auto pb-1">
          <div className="flex items-start min-w-[560px]">
            {PROGRESS_STATES.map((step, index) => {
              const isDone = !isCancelled && index < currentIndex;
              const isCurrent = !isCancelled && index === currentIndex;
              const colors = STATE_COLORS[step.key];
              const isLast = index === PROGRESS_STATES.length - 1;

              return (
                <div key={step.key} className="relative flex flex-1 flex-col items-center text-center">
                  {/* Connector line */}
                  {!isLast && (
                    <span
                      className={`absolute left-1/2 top-3 h-0.5 w-full transition-colors duration-300 ${
                        isDone ? colors.line : 'bg-[#E8EBE7]'
                      }`}
                      aria-hidden="true"
                    />
                  )}

                  {/* Step dot */}
                  <span
                    className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                      isDone
                        ? `${colors.dot} text-white`
                        : isCurrent
                          ? `${colors.dot} text-white ring-4 ring-offset-1 ring-[#176B5B]/20`
                          : 'bg-[#E8EBE7] text-[#7C8681]'
                    }`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isDone ? (
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="1.5 6 4.5 9 10.5 3" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </span>

                  {/* Step label */}
                  <span
                    className={`mt-2.5 text-[10px] leading-tight px-1 transition-colors duration-300 ${
                      isCurrent
                        ? `font-bold ${colors.text}`
                        : isDone
                          ? 'font-semibold text-[#5A6661]'
                          : 'text-[#A8B0AA]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-[#F5E6E6] border border-[#DFC0C0] rounded-lg text-sm text-[#9B3535] font-semibold">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            This job was cancelled
          </div>
        )}
      </div>

      {/* ── Event Log ── */}
      {events.length > 0 && (
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-5">Activity Log</p>

          <ol className="relative space-y-0" aria-label="Job activity timeline">
            {events.map((event, index) => {
              const colors = STATE_COLORS[event.to_state] ?? STATE_COLORS['assigned'];
              const label = EVENT_LABELS[event.to_state] ?? `→ ${event.to_state.replace(/_/g, ' ')}`;
              const isLive = LIVE_STATES.has(event.to_state);
              const isLast = index === events.length - 1;

              return (
                <li key={event.id} className="flex gap-4">
                  {/* Dot + vertical connector */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-0.5 h-3 w-3 flex-shrink-0 rounded-full border-2 border-[#FFFEFA] ${colors.dot} ${
                        isLive && isLast ? 'animate-pulse' : ''
                      }`}
                      aria-hidden="true"
                    />
                    {!isLast && (
                      <span className="w-px flex-1 my-1 bg-[#E8EBE7]" aria-hidden="true" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-4 min-w-0 ${isLast ? '' : ''}`}>
                    <p className={`text-sm font-semibold ${colors.text}`}>{label}</p>
                    <p className="text-xs text-[#7C8681] mt-0.5">{formatEventTime(event.created_at)}</p>
                    {event.metadata && typeof event.metadata === 'object' && Object.keys(event.metadata).length > 0 && (
                      <p className="text-xs text-[#5A6661] mt-1 italic">
                        {(event.metadata as Record<string, string>).note ?? ''}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Empty event log fallback */}
      {events.length === 0 && (
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-3">Activity Log</p>
          <p className="text-sm text-[#7C8681]">No activity recorded yet.</p>
        </div>
      )}
    </div>
  );
}
