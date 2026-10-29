import { describe, expect, it } from 'vitest';
import { activeNavHref, isNavActive } from './nav';

const PRO = [
  { href: '/professional', exact: true },
  { href: '/professional/requests' },
  { href: '/professional/jobs' },
  { href: '/professional/earnings' },
];

const CUSTOMER = [
  { href: '/customer', exact: true },
  { href: '/customer/bookings' },
  { href: '/customer/bookings/new' },
];

describe('nav matching', () => {
  it('matches role home pages exactly', () => {
    expect(isNavActive('/professional', PRO[0])).toBe(true);
    expect(isNavActive('/professional/jobs', PRO[0])).toBe(false);
  });

  it('matches sections by prefix on a path boundary', () => {
    expect(activeNavHref('/professional/jobs/abc', PRO)).toBe('/professional/jobs');
    expect(isNavActive('/professional/jobsearch', PRO[2])).toBe(false);
  });

  it('marks only the most specific item', () => {
    expect(activeNavHref('/customer/bookings/new', CUSTOMER)).toBe('/customer/bookings/new');
    expect(activeNavHref('/customer/bookings/123', CUSTOMER)).toBe('/customer/bookings');
  });

  it('returns null outside the nav', () => {
    expect(activeNavHref('/professional/profile', PRO)).toBeNull();
  });
});
