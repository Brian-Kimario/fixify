'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, CircleAlert, CircleCheck, Loader2 } from 'lucide-react';
import { updateProfessionalProfileAction } from './actions';

interface FormState {
  fullName: string;
  phone: string;
  bio: string;
  yearsExperience: string;
  categoryIds: string[];
}

type TextField = Exclude<keyof FormState, 'categoryIds'>;

const BIO_MAX = 500;

const inputClass =
  'block min-h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-[15px] text-ink placeholder:text-ink-4 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25 aria-[invalid=true]:border-danger';

export function EditProfessionalProfileForm({
  initial,
  email,
  categories,
}: {
  initial: FormState;
  email: string | null;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set(key: TextField, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function toggleCategory(id: string) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id) ? f.categoryIds.filter((c) => c !== id) : [...f.categoryIds, id],
    }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfessionalProfileAction(form);
      if (result.success === false) {
        const next: Record<string, string> = {};
        for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages[0]) next[key.split('.')[0]] = messages[0];
        }
        setErrors(next);
        setFormError(result.error);
        return;
      }
      setErrors({});
      setSaved(true);
      router.refresh();
    });
  }

  const noSkills = form.categoryIds.length === 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      )}
      {saved && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2.5 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
        >
          <CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="flex-1">Profile saved.</p>
          <Link href="/professional/profile" className="font-semibold underline-offset-2 hover:underline">
            View profile
          </Link>
        </div>
      )}

      <fieldset className="rounded-3xl border border-line bg-paper p-6 md:p-8">
        <legend className="sr-only">Personal details</legend>
        <h2 className="text-base font-semibold text-ink">Personal details</h2>
        <p className="mt-0.5 text-sm text-ink-3">How customers see and reach you.</p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field id="fullName" label="Full name" error={errors.fullName} className="md:col-span-2">
            <input
              id="fullName"
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              className={inputClass}
              required
            />
          </Field>

          <Field id="phone" label="Phone" hint="Shared with a customer once you accept their job." error={errors.phone}>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
              className={inputClass}
            />
          </Field>

          <Field id="yearsExperience" label="Years of experience" error={errors.yearsExperience}>
            <input
              id="yearsExperience"
              inputMode="numeric"
              placeholder="e.g. 5"
              value={form.yearsExperience}
              onChange={(e) => set('yearsExperience', e.target.value.replace(/\D/g, '').slice(0, 2))}
              aria-invalid={Boolean(errors.yearsExperience)}
              aria-describedby={errors.yearsExperience ? 'yearsExperience-error' : undefined}
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2">
            <p className="text-sm font-medium text-ink-2">Email</p>
            <p className="mt-1.5 flex min-h-11 items-center rounded-xl border border-line bg-paper-2 px-3.5 text-[15px] text-ink-3">
              {email ?? 'Not set'}
            </p>
            <p className="mt-1 text-xs text-ink-4">Your sign-in email can’t be changed here.</p>
          </div>

          <Field
            id="bio"
            label="About you"
            hint="A couple of lines on your experience and the work you do best."
            error={errors.bio}
            className="md:col-span-2"
            counter={`${form.bio.length}/${BIO_MAX}`}
            over={form.bio.length > BIO_MAX}
          >
            <textarea
              id="bio"
              rows={4}
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              aria-invalid={Boolean(errors.bio) || form.bio.length > BIO_MAX}
              aria-describedby={errors.bio ? 'bio-error' : 'bio-hint'}
              className={`${inputClass} min-h-28 py-2.5`}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-3xl border border-line bg-paper p-6 md:p-8">
        <legend className="sr-only">Skills</legend>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Skills</h2>
          <span className="text-sm text-ink-3">{form.categoryIds.length} selected</span>
        </div>
        <p className="mt-0.5 text-sm text-ink-3">Bookings are only offered to you in the categories you pick.</p>

        {categories.length === 0 ? (
          <p className="mt-4 text-sm text-ink-3">No service categories are available right now.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const selected = form.categoryIds.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-paper px-4 text-sm font-medium text-ink-2 hover:border-line-strong has-checked:border-teal has-checked:bg-teal-wash has-checked:text-teal has-focus-visible:ring-2 has-focus-visible:ring-teal/40"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                  {cat.name}
                </label>
              );
            })}
          </div>
        )}
        {noSkills && categories.length > 0 && (
          <p className="mt-4 rounded-xl bg-ochre-soft px-3 py-2 text-sm text-ochre">
            With no skills selected, no bookings can be offered to you.
          </p>
        )}
        {errors.categoryIds && <p className="mt-2 text-sm text-danger">{errors.categoryIds}</p>}
      </fieldset>

      <div className="sticky bottom-[calc(57px+env(safe-area-inset-bottom))] -mx-4 grid grid-cols-2 gap-3 border-t border-line bg-porcelain/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Link
          href="/professional/profile"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-paper px-5 text-sm font-semibold text-ink hover:bg-paper-2"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal px-5 text-sm font-semibold text-paper hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  className,
  counter,
  over,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  counter?: string;
  over?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink-2">
          {label}
        </label>
        {counter && <span className={`text-xs tabular-nums ${over ? 'text-danger' : 'text-ink-4'}`}>{counter}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-ink-4">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
