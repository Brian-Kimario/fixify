#!/usr/bin/env node

/**
 * Phase 3 — State Machine Enforcement Live Testing (Simplified)
 * Tests invalid state transitions using direct RPC calls
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Read .env.local
const envPath = path.join(projectRoot, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase config');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const results = [];

console.log('🧪 Phase 3 — State Machine Enforcement Testing\n');
console.log(`📍 Supabase: ${supabaseUrl}\n`);

/**
 * Helper: Create full test data hierarchy
 */
async function createTestData() {
  const customerId = crypto.randomUUID();
  const professionalId = crypto.randomUUID();
  const propertyId = crypto.randomUUID();
  const serviceId = crypto.randomUUID();

  try {
    // Create profiles
    await supabase.from('profiles').insert([
      { id: customerId, email: `c-${customerId.slice(0,8)}@test`, role: 'customer' },
      { id: professionalId, email: `p-${professionalId.slice(0,8)}@test`, role: 'professional' }
    ]);

    // Create property
    await supabase.from('properties').insert({
      id: propertyId,
      customer_id: customerId,
      property_type: 'residential',
      address: 'Test Address',
    });

    // Create service
    await supabase.from('services').insert({
      id: serviceId,
      name: 'Test Service',
      category: 'plumbing',
      base_price: 100,
    });

    // Create professional profile
    await supabase.from('professional_profiles').insert({
      user_id: professionalId,
      hourly_rate: 50,
      verification_status: 'verified',
      is_available: true,
    });

    // Create booking
    const { data: booking } = await supabase.from('bookings').insert({
      booking_reference: `TEST-${crypto.randomUUID().slice(0,8)}`,
      customer_id: customerId,
      property_id: propertyId,
      service_id: serviceId,
      professional_id: professionalId,
      scheduled_start: new Date().toISOString(),
      pricing_model: 'fixed',
      quoted_or_base_amount: 100,
    }).select().single();

    if (!booking) throw new Error('Booking creation failed');

    // Create job
    const { data: job } = await supabase.from('jobs').insert({
      booking_id: booking.id,
      customer_id: customerId,
      property_id: propertyId,
      professional_id: professionalId,
      current_state: 'assigned',
    }).select().single();

    if (!job) throw new Error('Job creation failed');

    return {
      job,
      booking,
      customerId,
      professionalId,
      propertyId,
      serviceId,
    };
  } catch (err) {
    console.error('Test data creation failed:', err.message);
    throw err;
  }
}

/**
 * Helper: Cleanup test data
 */
async function cleanupTestData(data) {
  try {
    const { job, booking, customerId, professionalId, propertyId, serviceId } = data;

    if (job) await supabase.from('jobs').delete().eq('id', job.id);
    if (booking) await supabase.from('bookings').delete().eq('id', booking.id);
    if (propertyId) await supabase.from('properties').delete().eq('id', propertyId);
    if (serviceId) await supabase.from('services').delete().eq('id', serviceId);
    if (professionalId) await supabase.from('professional_profiles').delete().eq('user_id', professionalId);
    if (customerId || professionalId) {
      await supabase.from('profiles').delete().in('id', [customerId, professionalId].filter(Boolean));
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

/**
 * Test 1: assigned → completed (INVALID)
 */
async function test1() {
  console.log('TEST 1: assigned → completed (MUST BE DENIED)');
  console.log('─'.repeat(60));

  const result = {
    testName: 'assigned → completed (MUST BE DENIED)',
    method: 'RPC',
    input: 'assigned → completed',
    expectedResult: 'DENIED',
    actualResult: '',
    error: null,
    pass: false,
  };

  let data = null;
  try {
    data = await createTestData();
    console.log(`✓ Test data created (job: ${data.job.id})`);

    const { error } = await supabase.rpc('transition_job_state', {
      p_job_id: data.job.id,
      p_new_state: 'completed',
      p_actor_user_id: data.customerId,
      p_metadata: {},
    });

    if (error) {
      console.log(`✓ Transition DENIED: ${error.message.substring(0, 50)}...`);
      result.actualResult = 'DENIED';
      result.error = error.message;
      result.pass = error.message.includes('Invalid state transition');
    } else {
      console.log(`❌ Transition ALLOWED (should have been denied!)`);
      result.actualResult = 'ALLOWED';
      result.pass = false;
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    result.actualResult = 'ERROR';
    result.error = err.message;
  } finally {
    if (data) await cleanupTestData(data);
  }

  results.push(result);
  console.log(`Result: ${result.pass ? '✅ PASS' : '❌ FAIL'}\n`);
}

/**
 * Test 2: quote_pending → assigned (backward, INVALID)
 */
async function test2() {
  console.log('TEST 2: quote_pending → assigned (backward, MUST BE DENIED)');
  console.log('─'.repeat(60));

  const result = {
    testName: 'quote_pending → assigned (MUST BE DENIED)',
    method: 'RPC',
    input: 'quote_pending → assigned',
    expectedResult: 'DENIED',
    actualResult: '',
    error: null,
    pass: false,
  };

  let data = null;
  try {
    data = await createTestData();
    const jobId = data.job.id;
    const actor = data.customerId;
    console.log(`✓ Test data created`);

    // Transition through valid path: assigned → accepted → on_the_way → arrived → in_progress → quote_pending
    for (const state of ['accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending']) {
      const { error } = await supabase.rpc('transition_job_state', {
        p_job_id: jobId,
        p_new_state: state,
        p_actor_user_id: actor,
        p_metadata: { setup: true },
      });

      if (error) {
        console.error(`❌ Setup failed at ${state}: ${error.message}`);
        result.actualResult = 'ERROR (setup failed)';
        result.error = error.message;
        result.pass = false;
        await cleanupTestData(data);
        results.push(result);
        return;
      }
    }

    console.log(`✓ Job transitioned to quote_pending`);

    // Try backward transition
    const { error } = await supabase.rpc('transition_job_state', {
      p_job_id: jobId,
      p_new_state: 'assigned',
      p_actor_user_id: actor,
      p_metadata: {},
    });

    if (error) {
      console.log(`✓ Backward transition DENIED: ${error.message.substring(0, 50)}...`);
      result.actualResult = 'DENIED';
      result.error = error.message;
      result.pass = error.message.includes('Invalid state transition');
    } else {
      console.log(`❌ Backward transition ALLOWED (should have been denied!)`);
      result.actualResult = 'ALLOWED';
      result.pass = false;
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    result.actualResult = 'ERROR';
    result.error = err.message;
  } finally {
    if (data) await cleanupTestData(data);
  }

  results.push(result);
  console.log(`Result: ${result.pass ? '✅ PASS' : '❌ FAIL'}\n`);
}

/**
 * Test 3: completed → in_progress (terminal, INVALID)
 */
async function test3() {
  console.log('TEST 3: completed → in_progress (MUST BE DENIED)');
  console.log('─'.repeat(60));

  const result = {
    testName: 'completed → in_progress (MUST BE DENIED)',
    method: 'RPC',
    input: 'completed → in_progress',
    expectedResult: 'DENIED',
    actualResult: '',
    error: null,
    pass: false,
  };

  let customerId, professionalId, propertyId, serviceId, bookingId, jobId;

  try {
    customerId = crypto.randomUUID();
    professionalId = crypto.randomUUID();
    propertyId = crypto.randomUUID();
    serviceId = crypto.randomUUID();

    // Create profiles
    await supabase.from('profiles').insert([
      { id: customerId, email: `c-${customerId.slice(0,8)}@test`, role: 'customer' },
      { id: professionalId, email: `p-${professionalId.slice(0,8)}@test`, role: 'professional' }
    ]);

    // Create property
    await supabase.from('properties').insert({
      id: propertyId,
      customer_id: customerId,
      property_type: 'residential',
      address: 'Test Address',
    });

    // Create service
    await supabase.from('services').insert({
      id: serviceId,
      name: 'Test Service',
      category: 'plumbing',
      base_price: 100,
    });

    // Create professional profile
    await supabase.from('professional_profiles').insert({
      user_id: professionalId,
      hourly_rate: 50,
      verification_status: 'verified',
      is_available: true,
    });

    // Create booking
    const { data: booking } = await supabase.from('bookings').insert({
      booking_reference: `TEST-${crypto.randomUUID().slice(0,8)}`,
      customer_id: customerId,
      property_id: propertyId,
      service_id: serviceId,
      professional_id: professionalId,
      scheduled_start: new Date().toISOString(),
      pricing_model: 'fixed',
      quoted_or_base_amount: 100,
    }).select().single();

    bookingId = booking.id;

    // Create job directly in 'completed' state
    const { data: job } = await supabase.from('jobs').insert({
      booking_id: bookingId,
      customer_id: customerId,
      property_id: propertyId,
      professional_id: professionalId,
      current_state: 'completed',
    }).select().single();

    jobId = job.id;
    console.log(`✓ Test job created in completed state`);

    // Try to transition from completed
    const { error } = await supabase.rpc('transition_job_state', {
      p_job_id: jobId,
      p_new_state: 'in_progress',
      p_actor_user_id: customerId,
      p_metadata: {},
    });

    if (error) {
      console.log(`✓ Transition from completed DENIED: ${error.message.substring(0, 50)}...`);
      result.actualResult = 'DENIED';
      result.error = error.message;
      result.pass = error.message.includes('Invalid state transition');
    } else {
      console.log(`❌ Transition from completed ALLOWED (should have been denied!)`);
      result.actualResult = 'ALLOWED';
      result.pass = false;
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    result.actualResult = 'ERROR';
    result.error = err.message;
  } finally {
    // Cleanup
    if (jobId) await supabase.from('jobs').delete().eq('id', jobId);
    if (bookingId) await supabase.from('bookings').delete().eq('id', bookingId);
    if (propertyId) await supabase.from('properties').delete().eq('id', propertyId);
    if (serviceId) await supabase.from('services').delete().eq('id', serviceId);
    if (professionalId) await supabase.from('professional_profiles').delete().eq('user_id', professionalId);
    if (customerId || professionalId) {
      await supabase.from('profiles').delete().in('id', [customerId, professionalId].filter(Boolean));
    }
  }

  results.push(result);
  console.log(`Result: ${result.pass ? '✅ PASS' : '❌ FAIL'}\n`);
}

/**
 * Test 4: assigned → accepted → on_the_way (VALID)
 */
async function test4() {
  console.log('TEST 4: assigned → accepted → on_the_way (MUST BE ALLOWED)');
  console.log('─'.repeat(60));

  const result = {
    testName: 'assigned → accepted → on_the_way (MUST BE ALLOWED)',
    method: 'RPC',
    input: 'assigned → accepted → on_the_way',
    expectedResult: 'ALLOWED',
    actualResult: '',
    error: null,
    pass: false,
  };

  let data = null;
  try {
    data = await createTestData();
    const jobId = data.job.id;
    const actor = data.customerId;
    console.log(`✓ Test data created`);

    // First transition: assigned → accepted
    const { error: err1 } = await supabase.rpc('transition_job_state', {
      p_job_id: jobId,
      p_new_state: 'accepted',
      p_actor_user_id: actor,
      p_metadata: { step: 1 },
    });

    if (err1) {
      console.error(`❌ First transition failed: ${err1.message}`);
      result.actualResult = 'DENIED (first failed)';
      result.error = err1.message;
      result.pass = false;
      await cleanupTestData(data);
      results.push(result);
      return;
    }

    console.log(`✓ First transition succeeded (assigned → accepted)`);

    // Second transition: accepted → on_the_way
    const { error: err2 } = await supabase.rpc('transition_job_state', {
      p_job_id: jobId,
      p_new_state: 'on_the_way',
      p_actor_user_id: actor,
      p_metadata: { step: 2 },
    });

    if (err2) {
      console.error(`❌ Second transition failed: ${err2.message}`);
      result.actualResult = 'DENIED (second failed)';
      result.error = err2.message;
      result.pass = false;
    } else {
      console.log(`✓ Second transition succeeded (accepted → on_the_way)`);
      result.actualResult = 'ALLOWED';
      result.pass = true;
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    result.actualResult = 'ERROR';
    result.error = err.message;
  } finally {
    if (data) await cleanupTestData(data);
  }

  results.push(result);
  console.log(`Result: ${result.pass ? '✅ PASS' : '❌ FAIL'}\n`);
}

/**
 * Generate report
 */
function generateReport() {
  const passCount = results.filter(r => r.pass).length;
  const totalCount = results.length;

  let report = `# Phase 3 State Machine Enforcement Test Results\n\n`;
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Status:** ${passCount === totalCount ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`;
  report += `**Score:** ${passCount}/${totalCount} tests passed\n\n`;

  report += `## Test Summary\n\n`;
  report += `| Test | Transition | Expected | Actual | Status |\n`;
  report += `|------|-----------|----------|--------|--------|\n`;

  results.forEach((r, idx) => {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    report += `| Test ${idx + 1} | ${r.input} | ${r.expectedResult} | ${r.actualResult} | ${status} |\n`;
  });

  report += `\n## Detailed Results\n\n`;

  results.forEach((r, idx) => {
    report += `### Test ${idx + 1}: ${r.testName}\n`;
    report += `- **Method:** ${r.method}\n`;
    report += `- **Transition:** ${r.input}\n`;
    report += `- **Expected:** ${r.expectedResult}\n`;
    report += `- **Actual:** ${r.actualResult}\n`;
    if (r.error) {
      report += `- **Error:** ${r.error.substring(0, 100)}\n`;
    }
    report += `- **Status:** ${r.pass ? '✅ PASS' : '❌ FAIL'}\n\n`;
  });

  report += `## Conclusion\n\n`;
  if (passCount === totalCount) {
    report += `✅ **All ${totalCount} tests PASSED!**\n\n`;
    report += `The state machine enforcement is working correctly:\n`;
    report += `- Invalid transitions are properly rejected by the RPC layer\n`;
    report += `- Valid transitions are allowed\n`;
    report += `- Database constraints prevent invalid state changes\n`;
  } else {
    report += `❌ **${totalCount - passCount} test(s) FAILED!**\n\n`;
    results.forEach((r, idx) => {
      if (!r.pass) {
        report += `- Test ${idx + 1}: ${r.testName} — ${r.error?.substring(0, 80) || 'Unknown error'}\n`;
      }
    });
  }

  return report;
}

/**
 * Run all tests
 */
async function runAllTests() {
  try {
    await test1();
    await test2();
    await test3();
    await test4();

    const report = generateReport();
    console.log('\n' + '='.repeat(60));
    console.log('FINAL REPORT');
    console.log('='.repeat(60) + '\n');
    console.log(report);

    // Write report
    const reportPath = path.join(projectRoot, '.agents/tasks/phase3-test-results.md');
    fs.writeFileSync(reportPath, report);
    console.log(`✅ Report written to: ${reportPath}\n`);

    const passCount = results.filter(r => r.pass).length;
    if (passCount === results.length) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log(`⚠️  ${results.length - passCount} test(s) failed`);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

runAllTests();
