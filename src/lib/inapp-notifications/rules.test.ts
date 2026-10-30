import { describe, expect, it } from 'vitest';
import { isNotificationKind, safeNotificationLink } from './rules';

describe('in-app notification rules', () => {
  it('knows the kinds the database writes', () => {
    expect(isNotificationKind('new_message')).toBe(true);
    expect(isNotificationKind('job_cancelled')).toBe(true);
    expect(isNotificationKind('payment_failed')).toBe(false);
  });

  it('accepts only in-app case links', () => {
    const id = '9b681bca-520d-462a-bd50-521c42f2b098';
    expect(safeNotificationLink(`/customer/bookings/${id}`)).toBe(`/customer/bookings/${id}`);
    expect(safeNotificationLink(`/professional/jobs/${id}`)).toBe(`/professional/jobs/${id}`);
    expect(safeNotificationLink(`https://evil.example/customer/bookings/${id}`)).toBeNull();
    expect(safeNotificationLink('//evil.example')).toBeNull();
    expect(safeNotificationLink('javascript:alert(1)')).toBeNull();
    expect(safeNotificationLink(`/admin/jobs/${id}`)).toBeNull();
  });
});
