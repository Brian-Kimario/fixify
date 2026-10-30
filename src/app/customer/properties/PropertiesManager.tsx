'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CircleAlert,
  History,
  Home,
  KeyRound,
  LocateFixed,
  MapPin,
  Pencil,
  Plus,
  Store,
  Trash2,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { SideOver } from '@/components/ui';
import { formatSlot, propertyTypeLabel } from '@/lib/shell/rules';
import type { CustomerProperty, PropertyAddress } from '@/lib/services/customer-properties';
import { deleteAddressAction, deletePropertyAction } from './actions';
import { PropertyForm } from './PropertyForm';

const TYPE_ICON: Record<string, LucideIcon> = {
  house: Home,
  villa: Home,
  apartment: Building2,
  office: Building,
  shop: Store,
};

function addressLines(a: PropertyAddress): string[] {
  return [
    [a.addressLine1, a.addressLine2].filter(Boolean).join(', '),
    [a.area, a.city].filter(Boolean).join(', '),
    [a.stateRegion, a.postalCode].filter(Boolean).join(' '),
  ].filter(Boolean);
}

type Editing = { mode: 'create' } | { mode: 'edit'; property: CustomerProperty } | null;

export function PropertiesManager({
  properties,
  looseAddresses,
}: {
  properties: CustomerProperty[];
  looseAddresses: PropertyAddress[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const active = properties.reduce((sum, p) => sum + p.activity.active, 0);
  const total = properties.reduce((sum, p) => sum + p.activity.total, 0);

  function removeProperty(id: string) {
    startTransition(async () => {
      const result = await deletePropertyAction({ propertyId: id });
      setConfirmingDelete(null);
      if (result.success === false) {
        setNotice({ tone: 'error', text: result.error });
        return;
      }
      setNotice({ tone: 'success', text: 'Property removed.' });
      router.refresh();
    });
  }

  function removeAddress(id: string) {
    startTransition(async () => {
      const result = await deleteAddressAction({ addressId: id });
      if (result.success === false) {
        setNotice({ tone: 'error', text: result.error });
        return;
      }
      setNotice({ tone: 'success', text: 'Address removed.' });
      router.refresh();
    });
  }

  function onSaved(message: string) {
    setEditing(null);
    setNotice({ tone: 'success', text: message });
    router.refresh();
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-3">Your places</p>
          <h1 className="mt-1 font-editorial text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink md:text-4xl">
            Properties
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-ink-3">
            The homes and workplaces you book services for. A complete address and access notes help the professional
            find you and arrive ready.
          </p>
        </div>
        {properties.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing({ mode: 'create' })}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-paper transition-colors hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add property
          </button>
        )}
      </div>

      {notice && (
        <div
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`mb-6 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            notice.tone === 'error' ? 'border-danger/30 bg-danger-soft text-danger' : 'border-success/30 bg-success-soft text-success'
          }`}
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="flex-1">{notice.text}</p>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="overflow-hidden rounded-3xl border border-line bg-paper">
          <div className="grid gap-6 p-6 md:grid-cols-2 md:p-10">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-wash text-teal">
                <Home className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-editorial text-2xl font-semibold text-ink">Add your first property</h2>
              <p className="mt-2 text-sm leading-6 text-ink-3">
                Every booking is for a property. Add where you live or work once, and book for it in a couple of taps.
              </p>
              <button
                type="button"
                onClick={() => setEditing({ mode: 'create' })}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-paper hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add property
              </button>
            </div>
            <ul className="space-y-3 self-center text-sm text-ink-2">
              {[
                { Icon: MapPin, text: 'Area and city decide which nearby professionals can take the job.' },
                { Icon: KeyRound, text: 'Access notes (gate code, floor, parking) are shared once a professional accepts.' },
                { Icon: History, text: 'Each property keeps its own service history.' },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3 rounded-2xl bg-paper-2/70 p-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <>
          <dl className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-3">
            <div className="flex items-center gap-1.5">
              <dt>Properties</dt>
              <dd className="font-semibold tabular-nums text-ink">{properties.length}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt>Bookings</dt>
              <dd className="font-semibold tabular-nums text-ink">{total}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt>In progress</dt>
              <dd className="font-semibold tabular-nums text-ink">{active}</dd>
            </div>
          </dl>

          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {properties.map((p) => (
              <li key={p.id}>
                <PropertyCard
                  property={p}
                  confirming={confirmingDelete === p.id}
                  pending={pending}
                  onEdit={() => setEditing({ mode: 'edit', property: p })}
                  onAskDelete={() => setConfirmingDelete(p.id)}
                  onCancelDelete={() => setConfirmingDelete(null)}
                  onDelete={() => removeProperty(p.id)}
                />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setEditing({ mode: 'create' })}
                className="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-line-strong bg-paper/50 p-6 text-sm font-semibold text-ink-3 transition-colors hover:border-teal hover:bg-teal-wash hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-2">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </span>
                Add another property
              </button>
            </li>
          </ul>
        </>
      )}

      {looseAddresses.length > 0 && (
        <section aria-labelledby="loose-addresses" className="mt-10">
          <h2 id="loose-addresses" className="text-base font-semibold text-ink">
            Saved addresses without a property
          </h2>
          <p className="mt-0.5 text-sm text-ink-3">These aren’t used for bookings. Remove any you no longer need.</p>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-paper">
            {looseAddresses.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0 text-ink-4" aria-hidden="true" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-ink">{a.label}</p>
                  <p className="truncate text-ink-3">{addressLines(a).join(' · ')}</p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeAddress(a.id)}
                  aria-label={`Remove address ${a.label}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink-3 hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SideOver
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.property.name}` : 'Add a property'}
        subtitle={editing?.mode === 'edit' ? 'Property' : 'New property'}
        width="lg"
      >
        {editing && (
          <PropertyForm
            key={editing.mode === 'edit' ? editing.property.id : 'new'}
            property={editing.mode === 'edit' ? editing.property : null}
            onCancel={() => setEditing(null)}
            onSaved={onSaved}
          />
        )}
      </SideOver>
    </>
  );
}

function PropertyCard({
  property: p,
  confirming,
  pending,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  property: CustomerProperty;
  confirming: boolean;
  pending: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICON[p.propertyType] ?? Warehouse;
  const lines = p.address ? addressLines(p.address) : [];
  const pinned = p.address?.latitude != null && p.address?.longitude != null;
  const canDelete = p.activity.total === 0;

  return (
    <article className="flex h-full flex-col rounded-3xl border border-line bg-paper">
      <div className="flex items-start gap-4 p-5 md:p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-wash text-teal">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-ink">{p.name}</h2>
            <span className="rounded-full bg-paper-2 px-2 text-xs font-medium leading-5 text-ink-3">
              {propertyTypeLabel(p.propertyType)}
            </span>
          </div>
          {lines.length > 0 ? (
            <address className="mt-1.5 text-sm not-italic leading-6 text-ink-2">
              {lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          ) : (
            <p className="mt-1.5 text-sm text-ink-3">No address on file</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
            {pinned && (
              <span className="inline-flex items-center gap-1 text-teal">
                <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
                Location pinned
              </span>
            )}
            {p.address?.accessNotes && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{p.address.accessNotes}</span>
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${p.name}`}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-ink-3 hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-5 grid grid-cols-1 gap-2 rounded-2xl bg-paper-2/70 p-3 text-sm sm:grid-cols-2 md:mx-6">
        <Activity
          Icon={CalendarClock}
          label="Next visit"
          value={p.activity.next ? p.activity.next.serviceName : 'Nothing scheduled'}
          detail={p.activity.next ? formatSlot(p.activity.next.scheduledStart) : null}
        />
        <Activity
          Icon={CalendarCheck}
          label="Last service"
          value={p.activity.last ? p.activity.last.serviceName : 'No history yet'}
          detail={p.activity.last ? formatSlot(p.activity.last.scheduledStart) : null}
        />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 p-5 md:px-6">
        <Link
          href={`/customer/bookings/new?propertyId=${p.id}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-paper hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Book here
        </Link>
        <Link
          href={`/customer/bookings?property_id=${p.id}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-paper px-4 text-sm font-semibold text-ink hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <History className="h-4 w-4" aria-hidden="true" />
          History
          {p.activity.total > 0 && (
            <span className="rounded-full bg-paper-2 px-1.5 text-xs leading-5 tabular-nums text-ink-3">{p.activity.total}</span>
          )}
        </Link>
        {p.activity.active > 0 && (
          <span className="rounded-full bg-ochre-soft px-2.5 text-xs font-semibold leading-6 text-ochre">
            {p.activity.active} in progress
          </span>
        )}
        {canDelete && !confirming && (
          <button
            type="button"
            onClick={onAskDelete}
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-ink-3 hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remove
          </button>
        )}
      </div>

      {confirming && (
        <div role="alertdialog" aria-label={`Remove ${p.name}?`} className="mx-5 mb-5 rounded-2xl border border-danger/30 bg-danger-soft p-4 md:mx-6">
          <p className="text-sm font-semibold text-ink">Remove {p.name}?</p>
          <p className="mt-1 text-sm text-ink-2">Its address is removed too. This can’t be undone.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onDelete}
              className="inline-flex min-h-11 items-center rounded-xl bg-danger px-4 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {pending ? 'Removing…' : 'Remove property'}
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="inline-flex min-h-11 items-center rounded-xl border border-line bg-paper px-4 text-sm font-semibold text-ink"
            >
              Keep it
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function Activity({ Icon, label, value, detail }: { Icon: LucideIcon; label: string; value: string; detail: string | null }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 p-1">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-ink-4">{label}</p>
        <p className="truncate font-medium text-ink">{value}</p>
        {detail && <p className="text-xs text-ink-3">{detail}</p>}
      </div>
    </div>
  );
}
