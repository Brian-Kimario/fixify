'use client';

import { RAIL_STEPS, STATE_META, type JobState } from '@/lib/jobs/states';

interface TimelineStep {
  key: string;
  label: string;
}

interface TimelineProps {
  /** Key of the current step. */
  state: string;
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
 * StateRail - Job progress rail driven by the shared job state module.
 * Cancelled jobs sit off the rail and show the first step as current.
 */
interface StateRailProps {
  state: JobState;
}

const JOB_STEPS: TimelineStep[] = RAIL_STEPS.map((s) => ({ key: String(s.step), label: s.label }));

export function StateRail({ state }: StateRailProps) {
  return <Timeline state={String(STATE_META[state].step ?? 0)} steps={JOB_STEPS} />;
}
