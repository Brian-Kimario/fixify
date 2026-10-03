import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { BookingWizard } from '@/components/customer/BookingWizard';
import type {
  WizardCategory,
  WizardService,
  WizardProperty,
} from '@/components/customer/BookingWizard';
import Link from 'next/link';

export const metadata = {
  title: 'Book a Service — Fixify',
};

interface NewBookingPageProps {
  searchParams: Promise<{
    service?: string;
    category?: string;
    propertyId?: string;
    problem?: string;
  }>;
}

export default async function NewBookingPage({ searchParams }: NewBookingPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/customer/bookings/new');

  const supabase = await createClient();
  const {
    service: preselectedServiceId,
    category: preselectedCategoryId,
    propertyId: preselectedPropertyId,
    problem: preselectedProblem,
  } = await searchParams;

  // ── Load properties ─────────────────────────────────────────────────────
  const { data: rawProperties } = await supabase
    .from('properties')
    .select('id, name, property_type, addresses(address_line_1, city)')
    .eq('owner_customer_id', user.id)
    .order('created_at', { ascending: false });

  const properties: WizardProperty[] = (rawProperties ?? []).map((p) => {
    const addr = Array.isArray(p.addresses) ? p.addresses[0] : p.addresses;
    return {
      id: p.id,
      name: p.name,
      property_type: p.property_type,
      address: addr
        ? { address_line_1: addr.address_line_1, city: addr.city }
        : null,
    };
  });

  // ── Load catalogue ──────────────────────────────────────────────────────
  const { data: rawCategories } = await supabase
    .from('service_categories')
    .select('id, name, slug, description, icon_key')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const { data: rawServices } = await supabase
    .from('services')
    .select(`
      id, name, slug, description, pricing_model,
      base_price, inspection_fee, estimated_duration_minutes, category_id,
      service_options (
        id, name, option_type, is_required, sort_order,
        service_option_values (
          id, label, value, price_modifier, sort_order
        )
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  const categories: WizardCategory[] = (rawCategories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon_key: c.icon_key,
  }));

  // Group services by category_id
  const servicesByCategory: Record<string, WizardService[]> = {};
  for (const s of rawServices ?? []) {
    if (!servicesByCategory[s.category_id]) {
      servicesByCategory[s.category_id] = [];
    }
    const options = ((s.service_options as unknown as Array<{
      id: string;
      name: string;
      option_type: string;
      is_required: boolean;
      sort_order: number;
      service_option_values: Array<{
        id: string;
        label: string;
        value: string;
        price_modifier: number | null;
        sort_order: number;
      }>;
    }>) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((opt) => ({
        id: opt.id,
        name: opt.name,
        option_type: opt.option_type,
        is_required: opt.is_required,
        sort_order: opt.sort_order,
        values: (opt.service_option_values ?? [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((v) => ({
            id: v.id,
            label: v.label,
            value: v.value,
            price_modifier: v.price_modifier,
            sort_order: v.sort_order,
          })),
      }));

    servicesByCategory[s.category_id].push({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      pricing_model: s.pricing_model as WizardService['pricing_model'],
      base_price: s.base_price,
      inspection_fee: s.inspection_fee,
      estimated_duration_minutes: s.estimated_duration_minutes,
      options,
    });
  }

  // ── Resolve pre-selected category from service, slug, or name ──────────
  let resolvedCategoryId = preselectedCategoryId;

  // If it's a slug or human category name (e.g. "Plumbing", "HVAC"), match it
  if (resolvedCategoryId && !/^[0-9a-f-]{36}$/.test(resolvedCategoryId)) {
    const term = resolvedCategoryId.toLowerCase().trim();
    const match = categories.find(
      (c) =>
        c.slug === term ||
        c.name.toLowerCase() === term ||
        c.name.toLowerCase().includes(term) ||
        term.includes(c.name.toLowerCase())
    );
    resolvedCategoryId = match?.id;
  }

  if (preselectedServiceId && !resolvedCategoryId) {
    outer: for (const [catId, svcs] of Object.entries(servicesByCategory)) {
      for (const svc of svcs) {
        if (svc.id === preselectedServiceId) {
          resolvedCategoryId = catId;
          break outer;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC] pb-24">
      {/* Page header */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <Link
          href="/customer"
          className="inline-flex items-center gap-1.5 text-sm text-[#5A6661] hover:text-[#176B5B] transition-colors mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to dashboard
        </Link>
        <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
          NEW BOOKING
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#18211F]">Book a Service</h1>
        <p className="text-sm text-[#5A6661] mt-1">
          Tell us what you need, pick a time, and we&apos;ll match you with a verified professional.
        </p>
      </div>

      {/* No properties guard */}
      {properties.length === 0 && (
        <div className="mx-4 md:mx-8 mb-6 flex items-start gap-3 px-4 py-3 bg-[#FFF4E0] border border-[#E8D5A3] rounded-xl text-sm text-[#9B6700]">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            You need to add a property before booking.{' '}
            <Link href="/customer/properties" className="font-bold underline">
              Add a property →
            </Link>
          </span>
        </div>
      )}

      {/* Wizard */}
      <div className="px-4 md:px-8 max-w-2xl">
        <BookingWizard
          categories={categories}
          servicesByCategory={servicesByCategory}
          properties={properties}
          preselectedServiceId={preselectedServiceId}
          preselectedCategoryId={resolvedCategoryId}
          preselectedPropertyId={preselectedPropertyId}
          initialProblemNotes={preselectedProblem}
        />
      </div>
    </div>
  );
}
