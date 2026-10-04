'use client';

import { useState, useTransition } from 'react';
import { createBookingAction } from '@/app/customer/bookings/new/actions';
import { SuccessState } from '@/components/ui/SuccessState';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WizardCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_key: string | null;
}

export interface WizardOptionValue {
  id: string;
  label: string;
  value: string;
  price_modifier: number | null;
  sort_order: number;
}

export interface WizardOption {
  id: string;
  name: string;
  option_type: string;
  is_required: boolean;
  sort_order: number;
  values: WizardOptionValue[];
}

export interface WizardService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pricing_model: 'fixed' | 'inspection' | 'quote_after_inspection';
  base_price: number | null;
  inspection_fee: number | null;
  estimated_duration_minutes: number | null;
  options: WizardOption[];
}

export interface WizardProperty {
  id: string;
  name: string;
  property_type: string;
  address: { address_line_1: string; city: string } | null;
}

interface BookingWizardProps {
  categories: WizardCategory[];
  servicesByCategory: Record<string, WizardService[]>;
  properties: WizardProperty[];
  /** Pre-select a service (from ?service= query param) */
  preselectedServiceId?: string;
  preselectedCategoryId?: string;
  preselectedPropertyId?: string;
  initialProblemNotes?: string;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Category' },
  { label: 'Service' },
  { label: 'Date & Time' },
  { label: 'Confirm' },
] as const;

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8" role="list" aria-label="Booking steps">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none" role="listitem">
            <div className="flex flex-col items-center">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done
                    ? 'bg-[#176B5B] border-[#176B5B] text-white'
                    : active
                      ? 'bg-white border-[#176B5B] text-[#176B5B]'
                      : 'bg-white border-[#D9DED8] text-[#A8B0AA]'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1.5 6 4.5 9 10.5 3" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`mt-1.5 text-[10px] font-semibold whitespace-nowrap ${active ? 'text-[#176B5B]' : done ? 'text-[#5A6661]' : 'text-[#A8B0AA]'}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <span className={`flex-1 h-px mx-1 mb-4 transition-colors ${done ? 'bg-[#176B5B]' : 'bg-[#E8EBE7]'}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  lightbulb: '💡',
  wrench: '🔧',
  wind: '❄️',
  cpu: '🔌',
  paintbrush: '🎨',
  hammer: '🔨',
  sparkles: '✨',
};

const PRICING_LABEL: Record<string, string> = {
  fixed: 'Fixed price',
  inspection: 'Inspection fee',
  quote_after_inspection: 'Quote after inspection',
};

function formatPrice(service: WizardService): string {
  if (service.pricing_model === 'fixed' && service.base_price)
    return `₹${service.base_price.toLocaleString('en-IN')}`;
  if (service.pricing_model === 'inspection' && service.inspection_fee)
    return `₹${service.inspection_fee.toLocaleString('en-IN')} inspection fee`;
  if (service.pricing_model === 'quote_after_inspection' && service.inspection_fee)
    return `₹${service.inspection_fee.toLocaleString('en-IN')} site visit`;
  return 'Custom quote';
}

function formatDuration(mins: number | null): string {
  if (!mins) return '';
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function getMinDate(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2); // minimum 2h from now
  return d.toISOString().slice(0, 16);
}

// ── Main component ────────────────────────────────────────────────────────────

export function BookingWizard({
  categories,
  servicesByCategory,
  properties,
  preselectedServiceId,
  preselectedCategoryId,
  preselectedPropertyId,
  initialProblemNotes,
}: BookingWizardProps) {
  const router = useRouter();
  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<number>(() => {
    if (preselectedServiceId) return 2; // skip to DateTime
    if (preselectedCategoryId) return 1; // skip to Service
    return 0;
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    preselectedCategoryId ?? ''
  );
  const [selectedService, setSelectedService] = useState<WizardService | null>(() => {
    if (!preselectedServiceId) return null;
    for (const svcs of Object.values(servicesByCategory)) {
      const found = svcs.find((s) => s.id === preselectedServiceId);
      if (found) return found;
    }
    return null;
  });
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [scheduledStart, setScheduledStart] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(() => {
    if (preselectedPropertyId && properties.some((p) => p.id === preselectedPropertyId)) {
      return preselectedPropertyId;
    }
    return properties.length === 1 ? properties[0].id : '';
  });
  const [notes, setNotes] = useState<string>(initialProblemNotes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [successData, setSuccessData] = useState<{ bookingId?: string } | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentCategory = categories.find((c) => c.id === selectedCategoryId);
  const servicesForCategory = selectedCategoryId
    ? (servicesByCategory[selectedCategoryId] ?? [])
    : [];
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  // Compute displayed total with option modifiers
  const optionModifierTotal = selectedService
    ? selectedService.options.reduce((sum, opt) => {
        const val = selectedOptions[opt.id];
        if (!val) return sum;
        const ov = opt.values.find((v) => v.value === val);
        return sum + (ov?.price_modifier ?? 0);
      }, 0)
    : 0;

  const displayedPrice: string = (() => {
    if (!selectedService) return '';
    if (selectedService.pricing_model === 'fixed' && selectedService.base_price != null) {
      const total = selectedService.base_price + optionModifierTotal;
      return `₹${total.toLocaleString('en-IN')}`;
    }
    if (selectedService.pricing_model === 'inspection' && selectedService.inspection_fee != null) {
      return `₹${selectedService.inspection_fee.toLocaleString('en-IN')} inspection fee`;
    }
    return 'Quote after inspection';
  })();

  // ── Navigation ─────────────────────────────────────────────────────────────
  function goNext() {
    setError(null);
    setStep((s) => s + 1);
  }
  function goBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  // ── Step 0: Category ───────────────────────────────────────────────────────
  function renderCategoryStep() {
    return (
      <div>
        <h2 className="text-xl font-bold text-[#18211F] mb-1">What do you need help with?</h2>
        <p className="text-sm text-[#5A6661] mb-6">Select the service category that best matches your issue.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategoryId(cat.id); setSelectedService(null); setSelectedOptions({}); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                selectedCategoryId === cat.id
                  ? 'border-[#176B5B] bg-[#E2EEE9]'
                  : 'border-[#E8EBE7] bg-[#FFFEFA] hover:border-[#B8D5CB] hover:bg-[#F1F7F4]'
              }`}
              aria-pressed={selectedCategoryId === cat.id}
            >
              <span className="text-2xl" aria-hidden="true">
                {CATEGORY_ICONS[cat.icon_key ?? ''] ?? '🛠️'}
              </span>
              <span className={`text-sm font-bold text-center leading-tight ${selectedCategoryId === cat.id ? 'text-[#176B5B]' : 'text-[#18211F]'}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={goNext}
            disabled={!selectedCategoryId}
            className="px-6 py-2.5 bg-[#176B5B] text-white font-bold text-sm rounded-xl hover:bg-[#0D5144] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Service ────────────────────────────────────────────────────────
  function renderServiceStep() {
    return (
      <div>
        <h2 className="text-xl font-bold text-[#18211F] mb-1">
          {currentCategory?.name ?? 'Choose a service'}
        </h2>
        <p className="text-sm text-[#5A6661] mb-6">Select the specific service you need.</p>

        {servicesForCategory.length === 0 ? (
          <p className="text-sm text-[#7C8681]">No services available in this category.</p>
        ) : (
          <div className="space-y-3">
            {servicesForCategory.map((svc) => (
              <button
                key={svc.id}
                onClick={() => { setSelectedService(svc); setSelectedOptions({}); }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedService?.id === svc.id
                    ? 'border-[#176B5B] bg-[#E2EEE9]'
                    : 'border-[#E8EBE7] bg-[#FFFEFA] hover:border-[#B8D5CB]'
                }`}
                aria-pressed={selectedService?.id === svc.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`font-bold text-sm ${selectedService?.id === svc.id ? 'text-[#176B5B]' : 'text-[#18211F]'}`}>
                      {svc.name}
                    </p>
                    {svc.description && (
                      <p className="text-xs text-[#5A6661] mt-0.5 line-clamp-2">{svc.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#7C8681]">
                        {PRICING_LABEL[svc.pricing_model]}
                      </span>
                      {svc.estimated_duration_minutes && (
                        <span className="text-[10px] text-[#A8B0AA]">
                          {formatDuration(svc.estimated_duration_minutes)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className={`font-bold text-sm ${selectedService?.id === svc.id ? 'text-[#176B5B]' : 'text-[#18211F]'}`}>
                      {formatPrice(svc)}
                    </p>
                  </div>
                </div>

                {/* Service options — shown when this service is selected */}
                {selectedService?.id === svc.id && svc.options.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#C5D8CF] space-y-4">
                    {svc.options.map((opt) => (
                      <div key={opt.id}>
                        <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#5A6661] mb-2">
                          {opt.name}
                          {opt.is_required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {opt.values.map((ov) => (
                            <button
                              key={ov.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOptions((prev) => ({ ...prev, [opt.id]: ov.value }));
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                selectedOptions[opt.id] === ov.value
                                  ? 'border-[#176B5B] bg-[#176B5B] text-white'
                                  : 'border-[#D9DED8] bg-white text-[#18211F] hover:border-[#176B5B]'
                              }`}
                            >
                              {ov.label}
                              {ov.price_modifier != null && ov.price_modifier !== 0 && (
                                <span className="ml-1 opacity-75">
                                  {ov.price_modifier > 0 ? `+₹${ov.price_modifier}` : `-₹${Math.abs(ov.price_modifier)}`}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button onClick={goBack} className="px-4 py-2.5 text-sm font-semibold text-[#5A6661] border border-[#D9DED8] rounded-xl hover:bg-[#F1EEE5] transition">
            ← Back
          </button>
          <button
            onClick={goNext}
            disabled={!selectedService}
            className="px-6 py-2.5 bg-[#176B5B] text-white font-bold text-sm rounded-xl hover:bg-[#0D5144] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Date & Time ────────────────────────────────────────────────────
  function renderDateTimeStep() {
    return (
      <div>
        <h2 className="text-xl font-bold text-[#18211F] mb-1">When should we visit?</h2>
        <p className="text-sm text-[#5A6661] mb-6">Choose your preferred date and time. We&apos;ll confirm with a professional shortly.</p>

        <div className="space-y-5">
          {/* Date & Time picker */}
          <div>
            <label htmlFor="scheduled_start" className="block text-xs font-bold uppercase tracking-[0.1em] text-[#5A6661] mb-2">
              Preferred date & time <span className="text-red-500">*</span>
            </label>
            <input
              id="scheduled_start"
              type="datetime-local"
              min={getMinDate()}
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#D9DED8] rounded-xl text-sm text-[#18211F] bg-white focus:outline-none focus:border-[#176B5B] focus:ring-1 focus:ring-[#176B5B]"
            />
            <p className="text-xs text-[#7C8681] mt-1">Minimum 2 hours from now.</p>
          </div>

          {/* Property selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#5A6661] mb-2">
              Property <span className="text-red-500">*</span>
            </label>
            {properties.length === 0 ? (
              <div className="p-4 bg-[#FFF4E0] border border-[#E8D5A3] rounded-xl text-sm text-[#9B6700]">
                No properties found. <a href="/customer/properties" className="underline font-semibold">Add a property first.</a>
              </div>
            ) : (
              <div className="space-y-2">
                {properties.map((prop) => (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => setSelectedPropertyId(prop.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedPropertyId === prop.id
                        ? 'border-[#176B5B] bg-[#E2EEE9]'
                        : 'border-[#E8EBE7] bg-[#FFFEFA] hover:border-[#B8D5CB]'
                    }`}
                    aria-pressed={selectedPropertyId === prop.id}
                  >
                    <p className={`font-bold text-sm ${selectedPropertyId === prop.id ? 'text-[#176B5B]' : 'text-[#18211F]'}`}>
                      {prop.name}
                    </p>
                    {prop.address && (
                      <p className="text-xs text-[#5A6661] mt-0.5">
                        {prop.address.address_line_1}, {prop.address.city}
                      </p>
                    )}
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#A8B0AA] mt-0.5">
                      {prop.property_type}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optional notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-[0.1em] text-[#5A6661] mb-2">
              Notes for the professional <span className="text-[#A8B0AA]">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="E.g. Faucet is in the master bathroom. Gate code is 1234."
              className="w-full px-3 py-2.5 border border-[#D9DED8] rounded-xl text-sm text-[#18211F] bg-white focus:outline-none focus:border-[#176B5B] focus:ring-1 focus:ring-[#176B5B] resize-none"
            />
            <p className="text-xs text-[#A8B0AA] mt-1 text-right">{notes.length} / 400</p>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button onClick={goBack} className="px-4 py-2.5 text-sm font-semibold text-[#5A6661] border border-[#D9DED8] rounded-xl hover:bg-[#F1EEE5] transition">
            ← Back
          </button>
          <button
            onClick={goNext}
            disabled={!scheduledStart || !selectedPropertyId}
            className="px-6 py-2.5 bg-[#176B5B] text-white font-bold text-sm rounded-xl hover:bg-[#0D5144] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Review booking →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Confirm ────────────────────────────────────────────────────────
  function renderConfirmStep() {
    const formattedDate = scheduledStart
      ? new Date(scheduledStart).toLocaleString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

    return (
      <div>
        <h2 className="text-xl font-bold text-[#18211F] mb-1">Review your booking</h2>
        <p className="text-sm text-[#5A6661] mb-6">Please confirm the details below before submitting.</p>

        <div className="space-y-3 mb-6">
          {/* Service */}
          <div className="bg-[#F1F7F4] rounded-xl p-4 border border-[#C5D8CF]">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-1">Service</p>
            <p className="font-bold text-[#18211F]">{selectedService?.name}</p>
            {currentCategory && (
              <p className="text-xs text-[#5A6661] mt-0.5">{currentCategory.name}</p>
            )}
          </div>

          {/* Selected options */}
          {selectedService && selectedService.options.length > 0 && (
            <div className="bg-[#FFFEFA] rounded-xl p-4 border border-[#E8EBE7]">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-2">Your choices</p>
              <div className="space-y-1">
                {selectedService.options.map((opt) => {
                  const chosen = opt.values.find((v) => v.value === selectedOptions[opt.id]);
                  return (
                    <div key={opt.id} className="flex justify-between text-sm">
                      <span className="text-[#5A6661]">{opt.name}</span>
                      <span className="font-semibold text-[#18211F]">
                        {chosen ? chosen.label : <span className="text-[#A8B0AA]">Not selected</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="bg-[#FFFEFA] rounded-xl p-4 border border-[#E8EBE7]">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-1">Price</p>
            <p className="font-bold text-[#18211F] text-lg">{displayedPrice}</p>
            {selectedService?.pricing_model === 'inspection' && (
              <p className="text-xs text-[#5A6661] mt-0.5">Inspection fee collected on visit. Additional work quoted separately.</p>
            )}
            {selectedService?.pricing_model === 'quote_after_inspection' && (
              <p className="text-xs text-[#5A6661] mt-0.5">Site visit to assess scope. Final quote approved by you before work begins.</p>
            )}
          </div>

          {/* Date */}
          <div className="bg-[#FFFEFA] rounded-xl p-4 border border-[#E8EBE7]">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-1">Scheduled for</p>
            <p className="font-bold text-[#18211F]">{formattedDate}</p>
          </div>

          {/* Property */}
          <div className="bg-[#FFFEFA] rounded-xl p-4 border border-[#E8EBE7]">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-1">Property</p>
            <p className="font-bold text-[#18211F]">{selectedProperty?.name}</p>
            {selectedProperty?.address && (
              <p className="text-xs text-[#5A6661] mt-0.5">
                {selectedProperty.address.address_line_1}, {selectedProperty.address.city}
              </p>
            )}
          </div>

          {/* Notes */}
          {notes.trim() && (
            <div className="bg-[#FFFEFA] rounded-xl p-4 border border-[#E8EBE7]">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-1">Notes</p>
              <p className="text-sm text-[#18211F]">{notes}</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-[#F5E6E6] border border-[#DFC0C0] rounded-xl text-sm text-[#9B3535]">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Terms note */}
        <p className="text-xs text-[#7C8681] mb-5">
          By confirming, you agree to Fixify&apos;s terms of service. A professional will be matched and you will be notified.
        </p>

        <div className="flex justify-between">
          <button
            onClick={goBack}
            disabled={isPending}
            className="px-4 py-2.5 text-sm font-semibold text-[#5A6661] border border-[#D9DED8] rounded-xl hover:bg-[#F1EEE5] transition disabled:opacity-40"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              if (!selectedService || !selectedPropertyId || !scheduledStart) return;
              setError(null);
              startTransition(async () => {
                try {
                  const result = await createBookingAction({
                    serviceId: selectedService.id,
                    propertyId: selectedPropertyId,
                    scheduledStart: new Date(scheduledStart).toISOString(),
                    selectedOptions,
                    notes: notes.trim() || undefined,
                  });
                  // Show success state with booking ID
                  setSuccessData({ bookingId: result.bookingId });
                  setShowSuccessState(true);
                } catch (err: unknown) {
                  const msg =
                    err instanceof Error ? err.message : 'Something went wrong. Please try again.';
                  setError(msg);
                }
              });
            }}
            disabled={isPending}
            className="px-6 py-2.5 bg-[#176B5B] text-white font-bold text-sm rounded-xl hover:bg-[#0D5144] disabled:opacity-60 transition flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Booking…
              </>
            ) : (
              'Confirm Booking ✓'
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (showSuccessState && successData?.bookingId) {
    return (
      <SuccessState
        title="Request submitted"
        description="Your request is now waiting for professional review. You'll be notified when a professional shows interest."
        action={{
          label: 'View request',
          onClick: () => router.push(`/customer/bookings/${successData.bookingId}`),
        }}
        secondaryAction={{
          label: 'Done',
          onClick: () => router.push('/customer'),
        }}
      />
    );
  }

  return (
    <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-2xl p-6 md:p-8 shadow-sm">
      <StepBar current={step} />
      {step === 0 && renderCategoryStep()}
      {step === 1 && renderServiceStep()}
      {step === 2 && renderDateTimeStep()}
      {step === 3 && renderConfirmStep()}
    </div>
  );
}
