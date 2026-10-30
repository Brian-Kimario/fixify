'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { LocateFixed, X } from 'lucide-react';
import { propertyTypeLabel } from '@/lib/shell/rules';
import type { CustomerProperty } from '@/lib/services/customer-properties';
import { PROPERTY_TYPES, type PropertyFormInput } from '@/validators/property';
import { createPropertyAction, updatePropertyAction } from './actions';

type Fields = Omit<PropertyFormInput, 'latitude' | 'longitude'>;
type Coords = { latitude: number; longitude: number } | null;

function initialFields(p: CustomerProperty | null): Fields {
  const a = p?.address;
  return {
    name: p?.name ?? '',
    propertyType: PROPERTY_TYPES.find((t) => t === p?.propertyType) ?? 'house',
    notes: p?.notes ?? '',
    addressLine1: a?.addressLine1 ?? '',
    addressLine2: a?.addressLine2 ?? '',
    area: a?.area ?? '',
    city: a?.city ?? '',
    stateRegion: a?.stateRegion ?? '',
    postalCode: a?.postalCode ?? '',
    accessNotes: a?.accessNotes ?? '',
  };
}

const inputClass =
  'block min-h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-[15px] text-ink placeholder:text-ink-4 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25 aria-[invalid=true]:border-danger';

export function PropertyForm({
  property,
  onCancel,
  onSaved,
}: {
  property: CustomerProperty | null;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [fields, setFields] = useState<Fields>(() => initialFields(property));
  const [coords, setCoords] = useState<Coords>(() =>
    property?.address?.latitude != null && property.address.longitude != null
      ? { latitude: property.address.latitude, longitude: property.address.longitude }
      : null,
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function locate() {
    if (!('geolocation' in navigator)) {
      setLocationError('This browser can’t share its location.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      () => {
        setLocationError('Location wasn’t shared. You can still save the address without it.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const values: PropertyFormInput = {
      ...fields,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    };
    startTransition(async () => {
      const result = property
        ? await updatePropertyAction({ propertyId: property.id, values })
        : await createPropertyAction(values);
      if (result.success === true) {
        onSaved(property ? 'Property updated.' : 'Property added.');
        return;
      }
      if (result.success !== false) return;
      const next: Record<string, string> = {};
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        next[key.replace(/^values\./, '')] = messages[0] ?? '';
      }
      setErrors(next);
      setFormError(Object.keys(next).length > 0 ? 'Check the highlighted fields.' : result.error);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      {formError && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      )}

      <FormSection title="The place" hint="How you’ll recognise it when booking.">
        <Field id="name" label="Name" error={errors.name}>
          <input
            id="name"
            className={inputClass}
            value={fields.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Home, Mum’s flat, Office"
            maxLength={80}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Type</legend>
          <div className="grid grid-cols-3 gap-2">
            {PROPERTY_TYPES.map((t) => (
              <label
                key={t}
                className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-paper px-2 text-sm font-medium text-ink-2 transition-colors has-checked:border-teal has-checked:bg-teal-wash has-checked:text-teal has-focus-visible:ring-2 has-focus-visible:ring-teal"
              >
                <input
                  type="radio"
                  name="propertyType"
                  value={t}
                  checked={fields.propertyType === t}
                  onChange={() => set('propertyType', t)}
                  className="sr-only"
                />
                {propertyTypeLabel(t)}
              </label>
            ))}
          </div>
        </fieldset>
      </FormSection>

      <FormSection title="Address" hint="Area and city decide which nearby professionals see the job.">
        <Field id="addressLine1" label="House / flat and street" error={errors.addressLine1}>
          <input
            id="addressLine1"
            className={inputClass}
            value={fields.addressLine1}
            onChange={(e) => set('addressLine1', e.target.value)}
            autoComplete="address-line1"
            maxLength={200}
            required
            aria-invalid={Boolean(errors.addressLine1)}
            aria-describedby={errors.addressLine1 ? 'addressLine1-error' : undefined}
          />
        </Field>
        <Field id="addressLine2" label="Building, landmark" optional error={errors.addressLine2}>
          <input
            id="addressLine2"
            className={inputClass}
            value={fields.addressLine2 ?? ''}
            onChange={(e) => set('addressLine2', e.target.value)}
            autoComplete="address-line2"
            maxLength={200}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="area" label="Area / locality" optional error={errors.area}>
            <input
              id="area"
              className={inputClass}
              value={fields.area ?? ''}
              onChange={(e) => set('area', e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field id="city" label="City" error={errors.city}>
            <input
              id="city"
              className={inputClass}
              value={fields.city}
              onChange={(e) => set('city', e.target.value)}
              autoComplete="address-level2"
              maxLength={100}
              required
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? 'city-error' : undefined}
            />
          </Field>
          <Field id="stateRegion" label="State" optional error={errors.stateRegion}>
            <input
              id="stateRegion"
              className={inputClass}
              value={fields.stateRegion ?? ''}
              onChange={(e) => set('stateRegion', e.target.value)}
              autoComplete="address-level1"
              maxLength={100}
            />
          </Field>
          <Field id="postalCode" label="PIN code" optional error={errors.postalCode}>
            <input
              id="postalCode"
              className={inputClass}
              value={fields.postalCode ?? ''}
              onChange={(e) => set('postalCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="postal-code"
              aria-invalid={Boolean(errors.postalCode)}
              aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-line bg-paper-2/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Map location</p>
              <p className="text-xs text-ink-3">
                {coords
                  ? `Pinned at ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                  : 'Optional. Use it while you’re at the property.'}
              </p>
            </div>
            {coords ? (
              <button
                type="button"
                onClick={() => setCoords(null)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-ink-3 hover:bg-paper hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            ) : (
              <button
                type="button"
                onClick={locate}
                disabled={locating}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-paper px-3 text-sm font-semibold text-ink hover:border-teal hover:text-teal disabled:opacity-60"
              >
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
                {locating ? 'Locating…' : 'Use my location'}
              </button>
            )}
          </div>
          {(locationError || errors.latitude) && (
            <p className="mt-2 text-xs text-danger">{locationError ?? errors.latitude}</p>
          )}
        </div>
      </FormSection>

      <FormSection title="For the professional" hint="Shared with the professional assigned to your booking.">
        <Field id="accessNotes" label="Access notes" optional error={errors.accessNotes}>
          <textarea
            id="accessNotes"
            className={`${inputClass} min-h-20 py-2.5`}
            value={fields.accessNotes ?? ''}
            onChange={(e) => set('accessNotes', e.target.value)}
            placeholder="Gate code, floor, lift, parking"
            maxLength={500}
            rows={2}
          />
        </Field>
        <Field id="notes" label="Other notes" optional error={errors.notes}>
          <textarea
            id="notes"
            className={`${inputClass} min-h-20 py-2.5`}
            value={fields.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Pets, appliance brands, anything worth knowing"
            maxLength={500}
            rows={2}
          />
        </Field>
      </FormSection>

      <div className="sticky bottom-0 -mx-6 flex gap-3 border-t border-line bg-paper px-6 py-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-teal px-4 text-sm font-semibold text-paper hover:bg-teal-deep disabled:opacity-60 sm:flex-none"
        >
          {pending ? 'Saving…' : property ? 'Save changes' : 'Add property'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-paper px-4 text-sm font-semibold text-ink hover:bg-paper-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function FormSection({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-ink-3">{title}</h3>
        <p className="text-xs text-ink-4">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-ink-4">Optional</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
