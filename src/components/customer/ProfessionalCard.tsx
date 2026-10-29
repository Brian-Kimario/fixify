import { BadgeCheck, Briefcase, Clock, Phone, Star } from 'lucide-react';
import type { BookingProfessional } from '@/lib/services/matching';
import { responseTimeLabel } from '@/lib/shell/rules';

interface ProfessionalCardProps {
  professional: BookingProfessional;
  /** True while the job is still an offer the professional has not accepted. */
  awaitingAcceptance: boolean;
  /** Only passed once the professional has accepted. */
  phone?: string | null;
}

/**
 * The professional matched to a booking. Every line comes from get_booking_professional;
 * a rating is shown only once it has enough reviews (matching_config.rating_min_reviews).
 */
export function ProfessionalCard({ professional, awaitingAcceptance, phone }: ProfessionalCardProps) {
  const initials = professional.displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const response = responseTimeLabel(professional.medianResponseSeconds);

  return (
    <section className="rounded-xl border border-line bg-paper p-5" aria-labelledby="professional-heading">
      <p id="professional-heading" className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-4">
        {awaitingAcceptance ? 'Offered to' : 'Your professional'}
      </p>

      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-soft text-xs font-bold text-teal-deep"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-bold text-ink">{professional.displayName}</p>
            {professional.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </span>
            )}
          </div>

          {awaitingAcceptance && (
            <p className="mt-1 text-sm text-ink-3">
              Waiting for {professional.displayName} to accept. If they decline, we offer it to the next
              available professional.
            </p>
          )}

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-3">
            {professional.rating && (
              <li className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-ochre" aria-hidden="true" />
                {professional.rating.average.toFixed(1)} ({professional.rating.count} reviews)
              </li>
            )}
            <li className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
              {professional.jobsCompleted} {professional.jobsCompleted === 1 ? 'job' : 'jobs'} completed
            </li>
            {professional.yearsExperience != null && professional.yearsExperience > 0 && (
              <li>
                {professional.yearsExperience} {professional.yearsExperience === 1 ? 'year' : 'years'} experience
              </li>
            )}
            {response && (
              <li className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {response}
              </li>
            )}
          </ul>

          {professional.skills.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
              {professional.skills.map((skill) => (
                <li key={skill} className="rounded-full border border-line bg-porcelain px-2.5 py-0.5 text-xs text-ink-2">
                  {skill}
                </li>
              ))}
            </ul>
          )}

          {!awaitingAcceptance && phone && (
            <a
              href={`tel:${phone}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {phone}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
