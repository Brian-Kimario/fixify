/** How long after the scheduled start a customer may report that nobody came. */
export const NO_SHOW_GRACE_MINUTES = 30;

/** Both are enforced in the database; they are repeated here only to word the screens. */
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_MAX_REISSUES = 2;

export function noShowOpensAt(scheduledStart: string | Date): Date {
  return new Date(new Date(scheduledStart).getTime() + NO_SHOW_GRACE_MINUTES * 60_000);
}

export type NoShowEligibility =
  | { status: 'not_applicable' }
  | { status: 'too_early'; opensAt: Date }
  | { status: 'already_reported' }
  | { status: 'eligible' };

/**
 * Whether to offer the report. Advisory only: report_professional_no_show decides, on the database
 * clock, and a report is still just the customer's allegation.
 */
export function noShowEligibility(input: {
  state: string;
  arrivedAt: string | null;
  scheduledStart: string;
  now: Date;
  reported: boolean;
}): NoShowEligibility {
  if (!['accepted', 'on_the_way'].includes(input.state) || input.arrivedAt) return { status: 'not_applicable' };
  if (input.reported) return { status: 'already_reported' };
  const opensAt = noShowOpensAt(input.scheduledStart);
  return input.now < opensAt ? { status: 'too_early', opensAt } : { status: 'eligible' };
}

export type VerifyReason = 'incorrect' | 'locked' | 'expired' | 'already_used' | 'no_code';

export function verifyFailureMessage(reason: VerifyReason, attemptsLeft: number | null): string {
  switch (reason) {
    case 'incorrect':
      return attemptsLeft != null
        ? `That code is not right. ${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} left.`
        : 'That code is not right.';
    case 'locked':
      return 'Too many wrong attempts. Ask the customer to reissue the code, or contact support.';
    case 'expired':
      return 'This code has expired. Ask the customer to reissue it.';
    case 'already_used':
      return 'This code has already been used.';
    case 'no_code':
      return 'There is no active code. Ask the customer to reissue it.';
  }
}
