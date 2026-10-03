'use client';

/**
 * CustomersTable — Admin directory for registered customer accounts
 *
 * Features:
 * - Free-text search by customer name, email, or phone
 * - Metrics summary (Total customers, active bookings, owned properties)
 * - Detailed list of accounts with property & booking counts
 */

import { useState, useMemo } from 'react';
import type { AdminCustomer } from '@/lib/services/admin';

interface CustomersTableProps {
  initialCustomers: AdminCustomer[];
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CustomersTable({ initialCustomers }: CustomersTableProps) {
  const [customers] = useState(initialCustomers);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        (c.full_name ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalProperties = useMemo(
    () => customers.reduce((sum, c) => sum + c.properties_count, 0),
    [customers]
  );

  const totalBookings = useMemo(
    () => customers.reduce((sum, c) => sum + c.bookings_count, 0),
    [customers]
  );

  return (
    <div>
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-4">
          <div className="text-2xl font-bold text-[#18211F]">{customers.length}</div>
          <div className="text-xs text-[#5A6661] mt-0.5">Total Registered Customers</div>
        </div>
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-4">
          <div className="text-2xl font-bold text-[#18211F]">{totalProperties}</div>
          <div className="text-xs text-[#5A6661] mt-0.5">Properties Enrolled</div>
        </div>
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-4">
          <div className="text-2xl font-bold text-[#18211F]">{totalBookings}</div>
          <div className="text-xs text-[#5A6661] mt-0.5">Total Bookings Made</div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg
            viewBox="0 0 24 24"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C8681]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, email, phone…"
            className="w-full pl-9 pr-4 py-2 border border-[#D9DED8] rounded-xl bg-white text-sm text-[#18211F] placeholder-[#9BA5A0] focus:outline-none focus:border-[#5FE3B0] transition"
          />
        </div>
        <span className="text-xs text-[#7C8681]">
          {filtered.length} of {customers.length} customers
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-12 text-center text-sm text-[#7C8681]">
          No customers found matching search criteria.
        </div>
      ) : (
        <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D9DED8] bg-[#F7F4EC] text-left text-xs font-bold text-[#7C8681] uppercase tracking-wide">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3 text-center">Properties</th>
                  <th className="px-5 py-3 text-center">Bookings</th>
                  <th className="px-5 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DED8]">
                {filtered.map((cust) => {
                  const initials = (cust.full_name || cust.email || 'C')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={cust.id} className="hover:bg-[#F7F4EC] transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E2EEE9] text-[#0D5144] font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#18211F]">
                              {cust.full_name || 'Anonymous Customer'}
                            </div>
                            <div className="text-[11px] font-mono text-[#7C8681]">
                              {cust.id.slice(0, 8)}…
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <div className="text-[#18211F]">{cust.email ?? '—'}</div>
                        <div className="text-[#7C8681]">{cust.phone ?? '—'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#E6EEF2] text-[#416B84] border border-[#BCD0DB]">
                          {cust.properties_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#E2EEE9] text-[#2F7D5B] border border-[#C7DCCF]">
                          {cust.bookings_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-[#7C8681] whitespace-nowrap">
                        {formatDate(cust.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
