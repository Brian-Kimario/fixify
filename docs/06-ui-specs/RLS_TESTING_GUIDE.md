# RLS Testing Guide

## Overview

Row Level Security (RLS) policies are critical for data protection. This guide outlines manual testing procedures to verify that:
1. Users can only access their own data
2. Different roles have appropriate permissions
3. Profile updates respect role constraints

## Test Environment Setup

### Prerequisites
- Supabase local dev environment running (`supabase start`)
- Two test users created with different roles
- Access to Supabase Studio (http://localhost:54323)

### Create Test Users

1. **User A (Customer)**
   - Email: customer-a@test.local
   - Password: TestPass123
   - Role: customer

2. **User B (Professional)**
   - Email: professional-b@test.local
   - Password: TestPass123
   - Role: professional

3. **User C (Admin)**
   - Email: admin-c@test.local
   - Password: TestPass123
   - Role: admin

## Test Cases

### TC-1: User Can Only Read Own Profile

**Precondition:** Logged in as User A (customer-a@test.local)

**Steps:**
1. Navigate to `/app`
2. Open browser DevTools → Console
3. Run:
   ```javascript
   const { data } = await supabase.from('profiles').select('*').eq('id', 'USER_A_ID').single();
   console.log(data); // Should return User A's profile
   ```
4. Try to fetch User B's profile:
   ```javascript
   const { data, error } = await supabase.from('profiles').select('*').eq('id', 'USER_B_ID').single();
   console.log(error); // Should have permission denied error
   ```

**Expected Result:**
- ✓ Can read own profile
- ✗ Cannot read other user profiles (permission error)

### TC-2: User Cannot Update Other Users' Profiles

**Precondition:** Logged in as User A (customer)

**Steps:**
1. Try to update User B's profile:
   ```javascript
   const { error } = await supabase.from('profiles')
     .update({ full_name: 'Hacked' })
     .eq('id', 'USER_B_ID');
   console.log(error); // Should have permission denied error
   ```

**Expected Result:**
- ✗ Update fails with permission denied

### TC-3: User Cannot Change Own Role

**Precondition:** Logged in as User A (customer with role='customer')

**Steps:**
1. Try to change own role to admin:
   ```javascript
   const { error } = await supabase.from('profiles')
     .update({ role: 'admin' })
     .eq('id', 'USER_A_ID');
   console.log(error); // Should fail
   ```

**Expected Result:**
- ✗ Update fails (role cannot be changed by user)

### TC-4: Admin Can Read All Profiles

**Precondition:** Logged in as User C (admin)

**Steps:**
1. Query all profiles:
   ```javascript
   const { data, error } = await supabase.from('profiles').select('*');
   console.log(data); // Should return all profiles
   ```

**Expected Result:**
- ✓ Can read all profiles

### TC-5: Audit Logs Show User Actions

**Precondition:** System has logged some actions

**Steps:**
1. Query own audit logs:
   ```javascript
   const { data } = await supabase.from('audit_logs')
     .select('*')
     .eq('user_id', 'USER_A_ID');
   console.log(data);
   ```

**Expected Result:**
- ✓ Can read own audit logs
- ✓ Shows action, changes, timestamps

### TC-6: New Users Automatically Get Customer Role

**Precondition:** Create new account via `/auth/register`

**Steps:**
1. Sign up as new user with role='customer'
2. Sign out and sign back in
3. Check profile:
   ```javascript
   const { data } = await supabase.from('profiles')
     .select('*')
     .eq('id', 'auth.uid()')
     .single();
   console.log(data.role); // Should be 'customer'
   ```

**Expected Result:**
- ✓ Profile created automatically
- ✓ Role is 'customer' by default

## Automated Testing (Future)

Once manual testing passes, implement automated tests:

```typescript
// tests/rls.test.ts
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies', () => {
  it('user cannot read other profiles', async () => {
    // Test implementation
  });

  it('admin can read all profiles', async () => {
    // Test implementation
  });

  it('user cannot change role', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### "New row violates row level security policy"

This means RLS denied the operation. Check:
1. User is authenticated
2. User has correct role
3. Policy conditions are met

### "Relation does not exist"

Table or trigger not created:
1. Check Supabase status: `supabase status`
2. Run migrations: `supabase db push`
3. Check SQL migrations for errors

### Session Not Persisting

Check middleware:
1. Verify middleware.ts runs on `/app` routes
2. Check cookies in DevTools → Application
3. Verify NEXT_PUBLIC_SUPABASE_URL and KEY are set

## Testing Checklist

- [ ] TC-1: User can read own profile
- [ ] TC-2: User cannot read other profiles
- [ ] TC-3: User cannot change own role
- [ ] TC-4: Admin can read all profiles
- [ ] TC-5: Audit logs accessible to user
- [ ] TC-6: New users get customer role automatically
- [ ] Session persists on page refresh
- [ ] Logout clears cookies
- [ ] Login creates session cookies
- [ ] OAuth callback creates profile

## Sign-Off

When all tests pass:

```
Tested by: [Your Name]
Date: [YYYY-MM-DD]
Environment: [local/staging/production]
Result: ✅ PASS / ❌ FAIL
```

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [IDENTITY_FOUNDATION_SPEC.md](../03-architecture/IDENTITY_FOUNDATION_SPEC.md) - RLS policy details
- [DATA_MODEL.md](../01-specifications/DATA_MODEL.md) - Database schema
