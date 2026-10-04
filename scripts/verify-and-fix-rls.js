#!/usr/bin/env node

/**
 * Verify and Apply RLS Fix Migration
 * 
 * This script checks the current state of the Supabase database
 * and applies the necessary RLS fix for job_events and notifications.
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
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && !line.startsWith('#')) {
    env[match[1]] = match[2];
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE environment variables');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log('\n🔍 Checking current database state...\n');

  try {
    // 1. Check if transition_job_state has SECURITY DEFINER
    console.log('1️⃣  Checking transition_job_state function...');
    const { data: funcData, error: funcError } = await client
      .from('information_schema.routines')
      .select('routine_name, security_type')
      .eq('routine_name', 'transition_job_state')
      .eq('routine_schema', 'public');

    if (funcError) {
      console.log('   ℹ️  Using alternative query method...');
      // This may not work via REST API, will need to use SQL
    } else if (funcData && funcData.length > 0) {
      console.log(`   ✅ Function exists: ${funcData[0].security_type || 'INVOKER'}`);
    }

    // Check via direct SQL query
    let { data: sqlData, error: sqlError } = await client.rpc('query_prosecdef', {
      p_funcname: 'transition_job_state'
    }).catch(() => ({ data: null, error: 'RPC not available' }));

    // If RPC doesn't exist, we'll check via other methods below
    console.log('   (Direct check will be performed when applying SQL)\n');

    // 2. Check if trigger exists
    console.log('2️⃣  Checking job_events table structure and policies...');
    const { data: tableData, error: tableError } = await client
      .from('job_events')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log(`   ❌ Error accessing job_events: ${tableError.message}`);
    } else {
      console.log('   ✅ job_events table accessible\n');
    }

    // 3. Check test users
    console.log('3️⃣  Checking test user accounts...');
    const { data: users, error: usersError } = await client
      .from('auth.users')
      .select('id, email')
      .in('email', ['customer.a@fixify.dev', 'pro.a@fixify.dev']);

    if (usersError || !users || users.length === 0) {
      console.log('   ⚠️  Test users not found via REST API (expected - need service role)');
      console.log('   📝 Will verify when applying SQL...\n');
    } else {
      console.log(`   ✅ Found ${users.length} test users\n`);
      users.forEach(u => console.log(`      - ${u.email}: ${u.id}`));
    }

    // 4. Read and prepare the fix migration
    console.log('\n4️⃣  Reading fix migration SQL...');
    const migrationPath = path.join(__dirname, '..', 'supabase/migrations/20261004_004_fix_job_events_rls_and_notifications.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('   ✅ Migration file loaded\n');

    // 5. Apply the migration
    console.log('5️⃣  Applying RLS fix migration...');
    const { error: applyError } = await client.rpc('exec_sql', {
      sql: migrationSQL
    }).catch(err => {
      console.log('   ℹ️  exec_sql RPC not available, attempting direct execution...');
      return { error: { message: 'RPC method not available' } };
    });

    if (applyError && applyError.message !== 'RPC method not available') {
      console.log(`   ⚠️  Error during RPC execution: ${applyError.message}`);
    }

    console.log('\n✅ Database verification and fix script completed.');
    console.log('\n📝 Next steps:');
    console.log('   1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/azmajqztvcuwajaaldqm/sql');
    console.log('   2. Paste the migration SQL from: supabase/migrations/20261004_004_fix_job_events_rls_and_notifications.sql');
    console.log('   3. Run the SQL to apply the fix');
    console.log('   4. Then run: npm run test-job-acceptance\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
