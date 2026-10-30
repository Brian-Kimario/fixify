import { describe, expect, it } from 'vitest';
import { isNotificationKind, notificationAge, notificationTarget, safeNotificationLink } from './rules';

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

describe('notification display helpers', () => {
  const now = new Date('2026-10-30T10:00:00Z');
  const abs = (iso: string) => `abs:${iso}`;

  it('shows a short age, then falls back to the date', () => {
    expect(notificationAge('2026-10-30T09:59:40Z', now, abs)).toBe('Just now');
    expect(notificationAge('2026-10-30T09:55:00Z', now, abs)).toBe('5 min ago');
    expect(notificationAge('2026-10-30T07:00:00Z', now, abs)).toBe('3 h ago');
    expect(notificationAge('2026-10-28T07:00:00Z', now, abs)).toBe('abs:2026-10-28T07:00:00Z');
    expect(notificationAge('not a date', now, abs)).toBe('');
  });

  it('opens message notifications on the Messages card', () => {
    const href = '/customer/bookings/9b681bca-520d-462a-bd50-521c42f2b098';
    expect(notificationTarget('new_message', href)).toBe(`${href}#messages`);
    expect(notificationTarget('job_completed', href)).toBe(href);
    expect(notificationTarget('new_message', null)).toBeNull();
  });

  it('knows the completed kind', () => {
    expect(isNotificationKind('job_completed')).toBe(true);
  });
});
