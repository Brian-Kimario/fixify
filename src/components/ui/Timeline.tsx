'use client';

type JobState =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'INSPECTION'
  | 'AWAITING_APPROVAL'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAYMENT_PENDING'
  | 'CLOSED'
  | 'DISPUTED';

interface TimelineStep {
  key: JobState;
  label: string;
}

interface TimelineProps {
  state: JobState;
  steps: TimelineStep[];
}

/**
 * Timeline - Displays job state progression
 * Shows completed steps (with checkmark), current step (with ring), and upcoming steps
 */
export function Timeline({ state, steps }: TimelineProps) {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.key === state));

  return (
    <div className="overflow-x-auto pb-2" aria-label="Job state timeline">
      <div className="flex min-w-[660px] items-start">
        {steps.map((step, index) => {
          const completed = index < currentIndex;
          const current = index === currentIndex;

          return (
            <div
              key={step.key}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <span
                  className={`absolute left-1/2 top-3 h-px w-full ${
                    index < currentIndex ? 'bg-teal' : 'bg-line'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator circle */}
              <span
                className={`relative z-10 grid h-6 w-6 place-items-center rounded-full border-4 border-paper text-[10px] font-bold ${
                  completed || current ? 'bg-teal text-white' : 'bg-line text-ink-4'
                } ${current ? 'ring-4 ring-teal-soft' : ''}`}
              >
                {completed ? '✓' : index + 1}
              </span>

              {/* Step label */}
              <span
                className={`mt-3 text-[11px] ${
                  current ? 'font-bold text-teal' : completed ? 'font-semibold text-ink-2' : 'text-ink-4'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * StateRail - Convenience component for job state timeline
 * Pre-configured with standard job states
 */
interface StateRailProps {
  state: JobState;
}

const JOB_STEPS: TimelineStep[] = [
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'ON_THE_WAY', label: 'On the way' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'INSPECTION', label: 'Inspection' },
  { key: 'AWAITING_APPROVAL', label: 'Approval' },
  { key: 'IN_PROGRESS', label: 'Work' },
  { key: 'COMPLETED', label: 'Complete' },
];

export function StateRail({ state }: StateRailProps) {
  return <Timeline state={state} steps={JOB_STEPS} />;
}
