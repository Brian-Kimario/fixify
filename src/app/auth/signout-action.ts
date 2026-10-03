/**
 * Sign-Out Server Action
 * 
 * Handles sign-out requests from client components
 * Server actions ensure secure sign-out without exposing backend logic
 */

'use server';

import { signOut as performSignOut } from '@/lib/auth/signout';
import { redirect } from 'next/navigation';

/**
 * Server action to handle sign-out
 * Called from sign-out button in client component
 */
export async function signOutAction(options?: {
  allDevices?: boolean;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await performSignOut(options);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Sign-out failed',
      };
    }

    // Redirect happens here - only on successful sign-out
    // The redirect ensures user cannot access protected routes
    redirect(result.redirectPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SignOutAction] Unexpected error:', errorMessage);

    return {
      success: false,
      error: 'An unexpected error occurred during sign-out',
    };
  }
}

/**
 * Sign out from all devices
 * More aggressive - terminates all sessions
 */
export async function signOutAllDevicesAction(reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await performSignOut({
      allDevices: true,
      reason: reason || 'user_requested_all_devices',
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to sign out from all devices',
      };
    }

    redirect(result.redirectPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SignOutAllDevicesAction] Unexpected error:', errorMessage);

    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Emergency sign-out (suspicious activity detected)
 * Signs out from all devices and triggers security audit
 */
export async function emergencySignOutAction(suspiciousActivity?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await performSignOut({
      allDevices: true,
      reason: suspiciousActivity || 'security_alert',
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Emergency sign-out failed',
      };
    }

    // In a real app, this would also trigger:
    // - Email notification to user
    // - Security review of account
    // - Reset of API keys/tokens
    // - Temporary login restrictions

    redirect(result.redirectPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EmergencySignOut] Unexpected error:', errorMessage);

    return {
      success: false,
      error: 'An unexpected error occurred during emergency sign-out',
    };
  }
}
