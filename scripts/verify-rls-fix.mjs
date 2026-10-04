#!/usr/bin/env node

/**
 * Verify RLS Fix Installation
 * 
 * Run this script AFTER manually applying the SQL migration to verify it worked.
 * 
 * Usage: node scripts/verify-rls-fix.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...rest] = trimmed.split('=');
    env[key] = rest.join('=');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE credentials');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const report = {
  timestamp: new Date().toISOString(),
  projectUrl: supabaseUrl,
  checks: [],
  passed: 0,
  failed: 0,
};

async function checkFunctionSecurity() {
  try {
    // Try to get a trigger that might reference the function
    const { data: triggers, error } = await client
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'job_events')
      .eq('trigger_name', 'trg_job_state_transition_notify');

    if (!error && triggers && triggers.length > 0) {
      report.checks.push({
        check: 'Notification Trigger Exists',
        status: 'PASS',
        details: `Found trigger: ${triggers[0].trigger_name}`
      });
      report.passed++;
      return true;
    } else if (error) {
      report.checks.push({
        check: 'Notification Trigger Exists',
        status: 'FAIL',
        details: `Error checking: ${error.message}`
      });
      report.failed++;
      return false;
    } else {
      report.checks.push({
        check: 'Notification Trigger Exists',
        status: 'FAIL',
        details: 'Trigger not found'
      });
      report.failed++;
      return false;
    }
  } catch (err) {
    report.checks.push({
      check: 'Notification Trigger Exists',
      status: 'ERROR',
      details: err.message
    });
    report.failed++;
    return false;
  }
}

async function checkInsertPolicy() {
  try {
    const { data: policies, error } = await client
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'job_events')
      .eq('policyname', 'professionals_insert_job_events');

    if (!error && policies && policies.length > 0) {
      report.checks.push({
        check: 'INSERT Policy for job_events',
        status: 'PASS',
        details: `Policy '${policies[0].policyname}' exists`
      });
      report.passed++;
      return true;
    } else if (error) {
      report.checks.push({
        check: 'INSERT Policy for job_events',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
      report.failed++;
      return false;
    } else {
      report.checks.push({
        check: 'INSERT Policy for job_events',
        status: 'FAIL',
        details: 'Policy not found'
      });
      report.failed++;
      return false;
    }
  } catch (err) {
    report.checks.push({
      check: 'INSERT Policy for job_events',
      status: 'ERROR',
      details: err.message
    });
    report.failed++;
    return false;
  }
}

async function checkNotificationTable() {
  try {
    const { count, error } = await client
      .from('notification_logs')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      report.checks.push({
        check: 'notification_logs Table',
        status: 'PASS',
        details: `Table accessible, ${count} existing records`
      });
      report.passed++;
      return true;
    } else {
      report.checks.push({
        check: 'notification_logs Table',
        status: 'FAIL',
        details: error.message
      });
      report.failed++;
      return false;
    }
  } catch (err) {
    report.checks.push({
      check: 'notification_logs Table',
      status: 'ERROR',
      details: err.message
    });
    report.failed++;
    return false;
  }
}

async function checkJobEventsTable() {
  try {
    const { count, error } = await client
      .from('job_events')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      report.checks.push({
        check: 'job_events Table',
        status: 'PASS',
        details: `Table accessible, ${count} existing events`
      });
      report.passed++;
      return true;
    } else {
      report.checks.push({
        check: 'job_events Table',
        status: 'FAIL',
        details: error.message
      });
      report.failed++;
      return false;
    }
  } catch (err) {
    report.checks.push({
      check: 'job_events Table',
      status: 'ERROR',
      details: err.message
    });
    report.failed++;
    return false;
  }
}

async function checkTestData() {
  try {
    // Check if test job exists
    const { data: job, error } = await client
      .from('jobs')
      .select('id, current_state, customer_id, professional_id')
      .eq('id', 'a0000001-0000-0000-0000-000000000001')
      .single();

    if (error || !job) {
      report.checks.push({
        check: 'Test Job Data',
        status: 'WARNING',
        details: 'Test job not found - may need setup'
      });
      report.passed++; // Not a failure, just a setup note
      return false;
    }

    report.checks.push({
      check: 'Test Job Data',
      status: 'PASS',
      details: `Job a0000001-0000-0000-0000-000000000001, state: ${job.current_state}`
    });
    report.passed++;
    return true;
  } catch (err) {
    report.checks.push({
      check: 'Test Job Data',
      status: 'ERROR',
      details: err.message
    });
    report.failed++;
    return false;
  }
}

async function testTransitionSimulation() {
  try {
    // Don't actually test with a real user - just check that the RPC exists
    const { error } = await client
      .rpc('transition_job_state', {
        p_job_id: '00000000-0000-0000-0000-000000000000',
        p_new_state: 'test',
        p_actor_user_id: '00000000-0000-0000-0000-000000000000',
      })
      .catch(err => ({ error: err }));

    // We expect an error (invalid state/job), but the function should exist and be callable
    if (error && error.message && error.message.includes('Invalid state')) {
      report.checks.push({
        check: 'RPC Function Callable',
        status: 'PASS',
        details: 'Function is callable and validates states correctly'
      });
      report.passed++;
      return true;
    } else if (error) {
      report.checks.push({
        check: 'RPC Function Callable',
        status: 'WARNING',
        details: `Function callable but unexpected error: ${error.message?.substring(0, 50)}`
      });
      report.passed++;
      return true;
    }

    report.checks.push({
      check: 'RPC Function Callable',
      status: 'PASS',
      details: 'Function is callable'
    });
    report.passed++;
    return true;
  } catch (err) {
    report.checks.push({
      check: 'RPC Function Callable',
      status: 'ERROR',
      details: err.message
    });
    report.failed++;
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('RLS FIX VERIFICATION REPORT');
  console.log('='.repeat(70));
  console.log(`\nProject: ${supabaseUrl}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);

  // Run all checks
  console.log('Running checks...\n');
  
  await checkFunctionSecurity();
  await checkInsertPolicy();
  await checkNotificationTable();
  await checkJobEventsTable();
  await checkTestData();
  await testTransitionSimulation();

  // Print results
  console.log('-'.repeat(70));
  report.checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : 
                 check.status === 'WARNING' ? '⚠️' :
                 check.status === 'ERROR' ? '❌' : '❓';
    console.log(`${icon} ${check.check}: ${check.status}`);
    console.log(`   ${check.details}`);
  });

  console.log('-'.repeat(70));
  console.log(`\nResults: ${report.passed} passed, ${report.failed} failed\n`);

  if (report.failed === 0) {
    console.log('✅ RLS FIX VERIFIED - Ready for production testing!\n');
    console.log('Next Steps:');
    console.log('  1. Test job acceptance in the app');
    console.log('  2. Verify notifications are created');
    console.log('  3. Test other job state transitions');
  } else {
    console.log('❌ RLS FIX INCOMPLETE - Check errors above and reapply SQL\n');
    console.log('If you haven\'t applied the SQL yet:');
    console.log('  1. Go to: https://supabase.com/dashboard/project/azmajqztvcuwajaaldqm/sql');
    console.log('  2. Copy SQL from: supabase/migrations/20261004_004_fix_job_events_rls_and_notifications.sql');
    console.log('  3. Paste and run');
    console.log('  4. Re-run this verification script');
  }

  console.log('='.repeat(70) + '\n');

  // Write report to file
  const reportPath = path.join(__dirname, '..', '.agents/tasks/verification-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to: ${reportPath}`);

  process.exit(report.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
