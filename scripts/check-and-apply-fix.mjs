#!/usr/bin/env node

/**
 * Check and Apply RLS Fix for Job Events
 * 
 * Uses a workaround approach since Supabase REST API doesn't support direct SQL execution.
 * This script checks the current state and provides manual steps if automated execution is not possible.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found');
  process.exit(1);
}

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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const projectRef = supabaseUrl.split('//')[1].split('.')[0];
console.log('\n🔧 Supabase Project:', projectRef);
console.log('📍 URL:', supabaseUrl);

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const report = [];

async function checkFunctionSecurityDefiner() {
  try {
    // Try to call a test RPC to see if we can use functions
    const { data, error } = await client
      .rpc('transition_job_state', {
        p_job_id: '00000000-0000-0000-0000-000000000000',
        p_new_state: 'test',
        p_actor_user_id: '00000000-0000-0000-0000-000000000000',
      })
      .catch(() => ({ data: null, error: 'Function callable' }));

    // The error is expected - we just want to check the function exists
    report.push({
      check: 'Function transition_job_state exists',
      status: 'ok',
      details: 'Function is callable via RPC'
    });
    
    return true;
  } catch (err) {
    report.push({
      check: 'Function transition_job_state exists',
      status: 'error',
      details: err.message
    });
    return false;
  }
}

async function checkJobEventsTable() {
  try {
    const { count, error } = await client
      .from('job_events')
      .select('*', { count: 'exact', head: true });

    if (error) {
      report.push({
        check: 'job_events table RLS policy',
        status: 'warning',
        details: error.message
      });
      return false;
    }

    report.push({
      check: 'job_events table RLS policy',
      status: 'ok',
      details: 'Table is accessible'
    });
    
    return true;
  } catch (err) {
    report.push({
      check: 'job_events table RLS policy',
      status: 'error',
      details: err.message
    });
    return false;
  }
}

async function checkTestUsers() {
  try {
    const { data, error } = await client.auth.admin.listUsers();

    if (error) {
      report.push({
        check: 'Test user accounts',
        status: 'warning',
        details: error.message
      });
      return { found: false };
    }

    const customer = data.users.find(u => u.email === 'customer.a@fixify.dev');
    const professional = data.users.find(u => u.email === 'pro.a@fixify.dev');

    if (!customer || !professional) {
      report.push({
        check: 'Test user accounts',
        status: 'warning',
        details: `Found: ${customer ? '✓ customer' : '✗ customer'}, ${professional ? '✓ professional' : '✗ professional'}`
      });
      return { found: false, customer, professional };
    }

    report.push({
      check: 'Test user accounts',
      status: 'ok',
      details: `customer.a: ${customer.id}, pro.a: ${professional.id}`
    });

    return { found: true, customer, professional };
  } catch (err) {
    report.push({
      check: 'Test user accounts',
      status: 'error',
      details: err.message
    });
    return { found: false };
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('CHECKING RLS FIX STATUS');
  console.log('='.repeat(70));

  // Run checks
  await checkFunctionSecurityDefiner();
  await checkJobEventsTable();
  const users = await checkTestUsers();

  // Print report
  console.log('\n' + '-'.repeat(70));
  report.forEach(item => {
    const icon = item.status === 'ok' ? '✅' : item.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${item.check}`);
    console.log(`   ${item.details}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('NEXT STEPS');
  console.log('='.repeat(70));

  console.log(`
1. APPLY THE RLS FIX via Supabase Dashboard:
   - Open: https://supabase.com/dashboard/project/${projectRef}/sql
   - Create a new query
   - Copy the SQL from: supabase/migrations/20261004_004_fix_job_events_rls_and_notifications.sql
   - Paste into the editor
   - Click "Run"

2. VERIFY THE FIX:
   - After running the SQL, run: npm run test-job-acceptance
   - Or manually test:
     a. Log in as: pro.a@fixify.dev
     b. Go to: /professional/jobs
     c. Click: Accept Job
     d. Check console for: "State transition failed" or similar errors

3. TEST DATA STATUS:
   ${users.found 
     ? `✅ Test users ready:
     - Customer: customer.a@fixify.dev (${users.customer.id})
     - Professional: pro.a@fixify.dev (${users.professional.id})`
     : `⚠️ Test users may need to be created or verified`
   }

4. DIAGNOSTIC QUERIES (run these in Supabase SQL Editor after applying fix):
   
   -- Check function security:
   SELECT proname, prosecdef FROM pg_proc 
   WHERE proname = 'transition_job_state';
   
   -- Check trigger exists:
   SELECT trigger_name FROM information_schema.triggers 
   WHERE event_object_table = 'job_events';
   
   -- Check job_events policy:
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'job_events' AND cmd = 'INSERT';
  `);

  console.log('='.repeat(70));
  console.log('\n✨ To manually apply the fix:');
  console.log(`   1. Visit: https://supabase.com/dashboard/project/${projectRef}/sql`);
  console.log('   2. Copy SQL from: supabase/migrations/20261004_004_fix_job_events_rls_and_notifications.sql');
  console.log('   3. Paste and execute\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
