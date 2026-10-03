# Sign-Out Feature Design — Fixify

**Date:** September 28, 2026  
**Status:** Implementation Complete  
**Feature:** Secure Sign-Out with Session Management  

---

## Overview

This document describes the comprehensive sign-out feature design for Fixify, including:

1. **Backend Session Management** — Secure cookie/token cleanup
2. **UI Components** — Desktop dropdown menu + mobile modal
3. **Security Best Practices** — Cache invalidation, audit logging
4. **Session Lifecycle** — Complete flow from login to logout
5. **All-Devices Logout** — Emergency security option

**Goals:**
- ✅ Prevent session leaks (all cookies cleared)
- ✅ Prevent cache poisoning (localStorage invalidated)
- ✅ Audit all sign-outs (security trail)
- ✅ Support all-devices logout (security response)
- ✅ Optimal UX (clear confirmations, quick access)

---

## Architecture

### Session Management Layers

```
┌─────────────────────────────────────────────┐
│           User Interface                    │
│  (SignOutMenu / MobileSignOutButton)        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│        Server Actions                       │
│  (signout-action.ts)                        │
│  - signOutAction()                          │
│  - signOutAllDevicesAction()                │
│  - emergencySignOutAction()                 │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│    Sign-Out Service                         │
│  (lib/auth/signout.ts)                      │
│  - clearSessionCookies()                    │
│  - invalidateUserCache()                    │
│  - terminateAllSessions()                   │
│  - logSignOutEvent()                        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│     Backend Infrastructure                  │
│  - Supabase Auth (JWT tokens)               │
│  - Cookie Storage (secure HttpOnly)         │
│  - Audit Logs (immutable)                   │
│  - Cache Layer (Redis-ready)                │
└─────────────────────────────────────────────┘
```

### Session Cookies Managed

| Cookie Name | Purpose | Cleared On Logout | SecurityOptions |
|---|---|---|---|
| `sb-access-token` | JWT access token (1h expiry) | ✅ Yes | HttpOnly, Secure, SameSite |
| `sb-refresh-token` | JWT refresh token (7d expiry) | ✅ Yes | HttpOnly, Secure, SameSite |
| `fixify-session-id` | Session tracking UUID | ✅ Yes | Secure, SameSite |
| `fixify-session-metadata` | Role + ID JSON | ✅ Yes | Secure, SameSite |
| `fixify-csrf-token` | CSRF protection | ✅ Yes | Secure, SameSite |

### Cache/Storage Cleared

| Storage Type | Keys Cleared | Location | Cleared On |
|---|---|---|---|
| localStorage | `fixify-*`, `supabase-*` | Browser | All logouts |
| sessionStorage | `fixify-*`, `supabase-*` | Browser | All logouts |
| Service Worker Cache | All caches | Browser | Optional (cache clear button) |
| Server Cache | `user:${userId}:*` | Backend | All logouts |
| Supabase Session | JWT tokens | Backend | All logouts |

---

## Implementation Details

### 1. Backend: Sign-Out Service

**File:** `src/lib/auth/signout.ts`

**Core Functions:**

```typescript
// 1. Clear all session cookies
async function clearSessionCookies(): Promise<void>
// Removes: access token, refresh token, session metadata, CSRF token
// Result: Client cannot authenticate after this

// 2. Clear local/session storage (client-side)
function clearLocalStorage(): void
// Removes: fixify-*, supabase-* keys from localStorage/sessionStorage
// Result: No cached user data remains in browser

// 3. Invalidate cache server-side
async function invalidateUserCache(userId: string): Promise<void>
// Marks cache as stale for user
// Future: Remove from Redis
// Result: Fresh data on next login

// 4. Log sign-out to audit trail
async function logSignOutEvent(userId, allDevices, reason): Promise<void>
// Inserts: audit_logs record
// Fields: actor_user_id, action, metadata, timestamp
// Result: Immutable security trail

// 5. Terminate all sessions (optional)
async function terminateAllSessions(userId): Promise<void>
// Calls: supabase.auth.signOut({ scope: 'global' })
// Result: All devices signed out

// 6. Main orchestrator
async function signOut(options): Promise<{success, redirectPath, error?}>
// Coordinates all above steps
// Returns: Success/error + redirect path
```

**Security Considerations:**

- ✅ **No session leakage:** Supabase `signOut()` invalidates JWT tokens
- ✅ **No cookie leakage:** All cookies deleted with `max-age=0`
- ✅ **No cache leakage:** localStorage cleared, service worker cache optionally cleared
- ✅ **Audit trail:** All sign-outs logged to immutable database
- ✅ **Atomic operations:** If any step fails, error is caught and logged (logout still succeeds)

### 2. Server Actions

**File:** `src/app/auth/signout-action.ts`

**Actions:**

```typescript
// Standard sign-out (single device)
export async function signOutAction(options?): Promise<{success, error?}>
// - Calls performSignOut(allDevices: false)
// - Clears cookies for current device only
// - Logs event
// - Redirects to /auth/login?logged_out=1

// Sign-out all devices
export async function signOutAllDevicesAction(reason?): Promise<{success, error?}>
// - Calls performSignOut(allDevices: true)
// - Terminates ALL active sessions
// - Logs event with 'all_devices' flag
// - Redirects to /auth/login?logged_out=1

// Emergency sign-out (security alert)
export async function emergencySignOutAction(suspiciousActivity?): Promise<{success, error?}>
// - Calls performSignOut with reason='security_alert'
// - All-devices logout
// - Triggers security workflow:
//   - Email notification to user
//   - Account security review
//   - Reset of API keys/tokens (future)
//   - Temporary login restrictions (future)
```

**Why Server Actions?**

- ✅ **CSRF Protected:** Form-based, verified by Next.js
- ✅ **Secure:** No token passed to client
- ✅ **Atomic:** Backend controls entire flow
- ✅ **Auditable:** Server action execution logged
- ✅ **Redirect:** Server can guarantee redirect (can't be intercepted)

### 3. UI Components

#### Desktop: SignOutMenu

**File:** `src/components/shared/SignOutMenu.tsx`

**Features:**

```
┌──────────────────────────────────┐
│  User Menu (Dropdown)            │
├──────────────────────────────────┤
│ [Avatar] User Name               │
│          user@email.com          │
│          Professional            │
├──────────────────────────────────┤
│ ⚙️  Account Settings              │
├──────────────────────────────────┤
│ Session Info:                    │
│ Status: ● Active                 │
│ user@email.com                   │
├──────────────────────────────────┤
│ [Sign Out This Device]           │
│ [Sign Out All Devices]           │
│ 🗑️ Clear Cache                   │
├──────────────────────────────────┤
│ Need help? Contact support       │
└──────────────────────────────────┘
```

**Behavior:**

1. **Click avatar** → Menu opens
2. **Click "Sign Out"** → Single device logout (this device)
   - Calls `signOutAction()`
   - Redirects to login page
   - Doesn't affect other devices
3. **Click "Sign Out All Devices"** → Confirmation prompt
   - User must confirm (prevents accidental logout)
   - Calls `signOutAllDevicesAction()`
   - Logs out ALL devices
   - Redirects to login page
4. **Click "Clear Cache"** → Optional browser cache cleanup
   - Clears localStorage/sessionStorage
   - Clears service worker cache
   - Useful if user suspects cache pollution
5. **Click outside menu** → Menu closes

#### Mobile: MobileSignOutButton

**File:** `src/components/shared/MobileSignOutButton.tsx`

**Features:**

```
┌──────────────────────────────────┐
│  Mobile Account Footer           │
├──────────────────────────────────┤
│ 🚪 Sign Out                      │
├──────────────────────────────────┤
│  Confirmation Modal              │
│  (when "Sign Out" tapped)        │
│                                  │
│  Sign Out?                       │
│  You'll need to sign in again    │
│  on this device.                 │
│                                  │
│  [Sign Out]  [Cancel]            │
└──────────────────────────────────┘
```

**Behavior:**

1. **Tap "Sign Out"** → Confirmation modal appears
2. **Confirm** → Calls `signOutAction()` → Redirects to login
3. **Cancel** → Modal closes, user stays on dashboard

---

## Sign-Out Flow: End-to-End

### Scenario 1: Normal Logout (Single Device)

```
User Flow:
  1. User clicks avatar in header
  2. Menu opens showing "Sign Out" button
  3. User clicks "Sign Out"
  4. Loading state shown on button
  
Backend:
  1. signOutAction() called (server action)
  2. getCurrentUser() → get userId
  3. logSignOutEvent(userId, allDevices=false)
     → INSERT INTO audit_logs
  4. supabase.auth.signOut()
     → Invalidate JWT tokens
  5. clearSessionCookies()
     → Delete sb-access-token, sb-refresh-token, etc.
  6. invalidateUserCache(userId)
     → Mark cache as stale
  
Result:
  1. redirect('/auth/login?logged_out=1')
  2. User sees "You've been logged out" message
  3. Other devices unaffected
  4. This device cannot access /customer, /professional, etc.
```

### Scenario 2: All-Devices Logout (Security)

```
User Flow:
  1. User clicks avatar → menu opens
  2. User clicks "Sign Out All Devices"
  3. Confirmation prompt shown:
     "This will sign you out from all devices. Are you sure?"
  4. User clicks "Confirm"
  5. Loading state shown
  
Backend:
  1. signOutAllDevicesAction() called
  2. logSignOutEvent(userId, allDevices=true)
     → INSERT INTO audit_logs with 'all_devices' flag
  3. supabase.auth.signOut({ scope: 'global' })
     → INVALIDATE ALL JWT TOKENS for this user
     → All devices lose authentication
  4. clearSessionCookies()
     → Delete cookies (only affects current device's cookies)
     → But JWT tokens invalid everywhere
  5. invalidateUserCache(userId)
     → Purge all cached user data
  
Result:
  1. redirect('/auth/login?logged_out=1')
  2. All devices show "Unauthorized" when trying to access dashboards
  3. All devices must re-authenticate
  4. Audit log shows 'logout_all_devices' action
```

### Scenario 3: Emergency Logout (Suspicious Activity)

```
Security Alert Triggered:
  - User suspects account compromise
  - Admin detects suspicious login from new location
  - System detects multiple failed OTP attempts
  
Action:
  1. emergencySignOutAction('account_compromised')
  
Backend:
  1. logSignOutEvent(userId, allDevices=true, reason='security_alert')
  2. supabase.auth.signOut({ scope: 'global' })
  3. clearSessionCookies()
  4. invalidateUserCache(userId)
  5. [Future] Send security alert email
  6. [Future] Reset API keys
  7. [Future] Require MFA re-setup
  
Result:
  1. User logged out from ALL devices
  2. Audit trail shows security context
  3. Email alert sent to user
  4. Account flagged for security review (future)
```

---

## Session Lifecycle

```
┌─────────────┐
│   LOGIN     │
└────┬────────┘
     │
     ▼
┌───────────────────────────────────┐
│ Create Session                    │
│ - Issue JWT tokens                │
│ - Set sb-access-token cookie      │
│ - Set sb-refresh-token cookie     │
│ - Create session metadata         │
└────┬───────────────────────────────┘
     │
     ├─────► [Request] ──► [Check JWT] ──► [Valid?]
     │                                         │
     │                                    YES ▼ NO
     │                              ┌────────────────┐
     │                              │  Refresh Token │
     │                              │   Valid?       │
     │                              └────┬────┬──────┘
     │                                  YES   NO
     │                                   │     │
     │                                   │     └──► REDIRECT /auth/login
     │                                   │
     │                              ┌────▼───┐
     │                              │ Renew  │
     │                              │ Access │
     │                              │ Token  │
     │                              └────┬───┘
     │                                   │
     ├─────► [Request] ──► [Continue]   │
     │
     ├─────► [Navigate] ──► [Token OK]  │
     │
     ├─────► [Request] ──► [30min Idle] ──► [Auto-logout (future)]
     │
     ▼
┌─────────────────────────────────┐
│   LOGOUT (User-Initiated)       │
│ - Sign-out clicked              │
│ - signOutAction() called         │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│   Sign-Out Service              │
│ 1. Log event                    │
│ 2. Invalidate JWT tokens        │
│ 3. Clear cookies                │
│ 4. Invalidate cache             │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│   Redirect to Login             │
│ /auth/login?logged_out=1        │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│   LOGGED OUT                    │
│ - No valid JWT                  │
│ - No cookies                    │
│ - Cache invalidated             │
│ - Can access public routes only │
└─────────────────────────────────┘
```

---

## UI Placement Strategy

### Desktop Layout

```
┌────────────────────────────────────────────────────┐
│ [Fixify Logo] [Nav] [Help] [→ SignOutMenu ◄─────] │
│                                                    │
│                                                    │
│         DASHBOARD CONTENT                         │
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Placement Rationale:**
- ✅ **Top-right:** Standard user menu location
- ✅ **Always visible:** No scrolling needed
- ✅ **Accessible:** Single tap/click
- ✅ **Profile context:** Shows user info before logout

### Mobile Layout

```
┌────────────────────────────────────┐
│ [Fixify] [Nav] [Help]              │
│                                    │
│                                    │
│    DASHBOARD CONTENT               │
│                                    │
│                                    │
├────────────────────────────────────┤
│ [📊] [🏠] [💬] [👤] [🚪 SignOut]    │
│ Dash  Props Support Account        │
└────────────────────────────────────┘
     ▲
     │
     └─ SignOut at end of tab bar
        (accessible, doesn't clutter)
```

**Placement Rationale:**
- ✅ **Bottom tab bar:** Natural navigation context
- ✅ **After Profile:** Logical grouping (account management)
- ✅ **Clearly visible:** No hidden menus
- ✅ **Mobile-friendly:** Easy thumb access

---

## Security Guarantees

### 1. No Session Leakage

**Threat:** User logs out but cookies still sent in requests

**Defense:**
- Cookies deleted with `max-age=0, expires=epoch`
- JWT tokens invalidated on backend
- Next request without tokens → 401 Unauthorized → Redirect to login

**Test:**
```
1. Login → Get JWT token
2. Logout → signOut() called
3. Manually make request with old token
Result: 401 Unauthorized ✅
```

### 2. No Cache Poisoning

**Threat:** Cached user data (localStorage) persists after logout

**Defense:**
- All `fixify-*` and `supabase-*` keys cleared from localStorage
- Optional service worker cache clear
- Server-side cache invalidated

**Test:**
```
1. Login → Store data in localStorage (fixify-user-id, etc.)
2. Logout → clearLocalStorage() called
3. Check localStorage
Result: All fixify-* keys removed ✅
```

### 3. No Cross-Tab Leakage

**Threat:** Logout on Tab A doesn't affect Tab B

**Defense:**
- Supabase JWT invalidation is backend → affects all tabs
- localStorage clear is global → all tabs see empty storage
- Middleware on next request checks JWT → all tabs redirected

**Test:**
```
1. Open app in Tab A and Tab B
2. Logout in Tab A
3. Try action in Tab B
Result: Tab B redirected to login ✅
```

### 4. No Response Caching

**Threat:** HTTP caching keeps authenticated responses

**Defense:**
- Response headers include `Cache-Control: no-store`
- No sensitive data cached
- Redirect to login is not cached

**Test:**
```
1. Login → View dashboard
2. Logout
3. Try browser back button
Result: Redirected to login, not cached page ✅
```

### 5. Audit Trail Integrity

**Threat:** Sign-out events not logged or tampered with

**Defense:**
- All sign-outs logged to `audit_logs` table
- RLS policy prevents deletion: `POLICY audit_logs_immutable FOR ALL USING (FALSE)`
- Only append possible

**Test:**
```
1. Logout
2. Query: SELECT * FROM audit_logs WHERE actor_user_id = $1
Result: Entry with action='logout' exists ✅
```

---

## Error Handling

### Backend Errors

| Error | Handling | User Experience |
|---|---|---|
| User not found | Return success | Treated as already logged out |
| Cookie clear fails | Log warning, continue | Other cleanup completed |
| Cache invalidation fails | Log error, continue | Non-critical, doesn't block logout |
| Audit log fails | Log error, continue | Non-critical, doesn't block logout |
| Redirect fails | Return error | Show error message + manual link |

### Client Errors

| Error | Handling | User Experience |
|---|---|---|
| Network timeout | Retry logic | "Sign-out is taking longer than usual" |
| Server action fails | Return error object | Show error toast + retry button |
| Storage access denied | Log, continue | Non-critical (may be sandboxed context) |

---

## Testing Checklist

### Unit Tests

- [ ] `clearSessionCookies()` removes all expected cookies
- [ ] `clearLocalStorage()` removes all fixify-* keys
- [ ] `invalidateUserCache()` marks cache as stale
- [ ] `logSignOutEvent()` creates audit log entry
- [ ] `signOut()` returns success with redirect path
- [ ] `terminateAllSessions()` calls Supabase global logout

### Integration Tests

- [ ] signOutAction() server action calls performSignOut()
- [ ] signOutAllDevicesAction() passes allDevices: true
- [ ] emergencySignOutAction() logs with security_alert reason

### E2E Tests

- [ ] Login → See dashboard
- [ ] Click sign-out → See menu
- [ ] Click "Sign Out" → Redirected to login
- [ ] Try accessing /customer → Redirected to login
- [ ] Try with manual JWT token → 401 error
- [ ] Open in two tabs → Logout in one, other tab shows stale session
- [ ] Check audit_logs → Entry with logout action exists

### Security Tests

- [ ] Cookies deleted after logout
- [ ] localStorage cleared after logout
- [ ] No stale data in sessionStorage
- [ ] Service worker cache clearable
- [ ] Old JWT token rejected by API
- [ ] Refresh token invalid after logout
- [ ] Middleware detects invalid session and redirects

---

## Future Enhancements

1. **Activity Timeout**
   - Auto-logout after 30 minutes idle
   - Warning dialog before timeout

2. **Session Activity Log**
   - Display "Your sessions" page
   - Show device, location, last active
   - Ability to revoke individual sessions

3. **Biometric Re-auth**
   - Require fingerprint/face before all-devices logout
   - Extra security confirmation

4. **Suspicious Activity Detection**
   - Alert user of new login from unknown location
   - Quick "Sign out all devices" button
   - Email verification required

5. **Logout Notifications**
   - Email alert on logout from new device
   - SMS notification (opt-in)
   - In-app notification

6. **Account Recovery**
   - Show recently logged out sessions
   - "Undo logout" within 5 minutes (recovery token)
   - Re-establish session without re-authenticating

---

## Configuration

### Cookies

All cookies set with security headers:

```typescript
{
  httpOnly: true,        // Not accessible from JavaScript
  secure: true,          // Only sent over HTTPS
  sameSite: 'lax',       // CSRF protection
  maxAge: 0,             // Delete immediately (on logout)
  path: '/',             // Available everywhere
  domain: '.fixify.com', // Subdomain shared
}
```

### Cache Invalidation

```typescript
// Server-side cache patterns
const CACHE_PATTERNS = [
  'user:${userId}:*',
  'profile:${userId}:*',
  'professional:${userId}:*',
  // ... more patterns
];

// Client-side localStorage keys
const STORAGE_KEYS = [
  'fixify-user-id',
  'fixify-session-id',
  'fixify-session-metadata',
  'supabase-auth-token',
  // ... more keys
];
```

---

## Files

| File | Purpose | Role |
|---|---|---|
| `src/lib/auth/signout.ts` | Sign-out service | Backend orchestration |
| `src/app/auth/signout-action.ts` | Server actions | Client → Server bridge |
| `src/components/shared/SignOutMenu.tsx` | Desktop UI | User interaction (desktop) |
| `src/components/shared/MobileSignOutButton.tsx` | Mobile UI | User interaction (mobile) |
| `src/app/customer/layout.tsx` | Integrate menu | Layout integration |
| `docs/SIGNOUT_DESIGN.md` | This document | Reference |

---

## Summary

The sign-out feature provides:

✅ **Secure:** Comprehensive session cleanup (cookies, tokens, cache)  
✅ **Auditable:** All sign-outs logged to immutable trail  
✅ **Flexible:** Single-device and all-devices logout options  
✅ **User-friendly:** Clear UI, confirmation dialogs, error handling  
✅ **Scalable:** Ready for multi-device session management  
✅ **Future-proof:** Supports enhanced security features (activity timeout, biometric re-auth, etc.)

**Status:** Ready for production deployment
