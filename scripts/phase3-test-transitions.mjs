#!/usr/bin/env node

/**
 * Phase 3 — State Machine Enforcement Live Testing
 * 
 * This script tests invalid state transitions against the live Supabase database
 * using the transition_job_state() RPC function.
 * 
 * Tests:
 * 1. assigned → completed (MUST BE DENIED)
 * 2. quote_pending → assigned (MUST BE DENIED) 
 * 3. completed → in_progress (MUST BE DENIED)
 * 4. assigned → accepted → on_the_way (MUST BE ALLOWED)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Read environment from .env.local directly
const envPath = path.join(projectRoot, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key to bypass RLS for testing purposes
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const results = [];

console.log('🧪 Phase 3 — State Machine Enforcement Testing\n');
console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

// Test 1: Create a job in 'assigned' state and try to jump to 'completed'
async function test1_assignedToCompleted() {
  console.log('TEST 1: assigned → completed (MUST BE DENIED)');
  console.log('─'.repeat(60));

  const result = {
    testName: 'assigned → completed (MUST BE DENIED)',
    method: 'RPC: transition_job_state()',
    input: {
      job_id: null,
      from_state: 'assigned',
      to_state: 'completed',
      actor: 'test-user-123',
    },
    expectedResult: 'DENIED',
    actualResult: '',
    error: null,
    pass: false,
  };

  try {
    // Create test data: profile, property, service, booking, job
    const customerId = crypto.randomUUID();
    const professionalId = crypto.randomUUID();
    const propertyId = crypto.randomUUID();
    const serviceId = crypto.randomUUID();
    
    // Create profiles
    await supabase.from('profiles').insert([
      { id: customerId, email: `customer-${customerId}@test.local`, role: 'customer' },
      { id: professionalId, email: `pro-${professionalId}@test.local`, role: 'professional' }
    ]);
    
    // Create property
    await supabase.from('properties').insert({
      id: propertyId,
      customer_id: customerId,
      property_type: 'residential',
      address: '123 Test St',
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
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: `TEST-${crypto.randomUUID()}`,
        customer_id: customerId,
        property_id: propertyId,
        service_id: serviceId,
        professional_id: professionalId,
        scheduled_start: new Date().toISOString(),
        pricing_model: 'fixed',
        quoted_or_base_amount: 100,
      })
      .select()
      .single();

    if (bookingError) {
      console.error(`❌ Failed to create booking: ${bookingError.message}`);
      result.pass = false;
      result.actualResult = 'ERROR: Could not create booking';
      results.push(result);
      return;
    }

    // Create job
    const { data: job, error: createError } = await supabase
      .from('jobs')
      .insert({
        booking_id: booking.id,
        customer_id: customerId,
        property_id: propertyId,
        professional_id: professionalId,
        current_state: 'assigned',
      })
      .select()
      .single();

    if (createError) {
      console.error(`❌ Failed to create test job: ${createError.message}`);
      result.pass = false;
      result.actualResult = 'ERROR: Could not create test job';
      results.push(result);
      return;
    }

    result.input.job_id = job.id;
    console.log(`✓ Created test job: ${job.id}`);

    // Try invalid transition
    const { error } = await supabase.rpc('transition_job_state', {
      p_job_id: job.id,
      p_new_state: 'completed',
      p_actor_user_id: customerId,
      p_metadata: { test: true },
    });

    // Cleanup
    await supabase.from('jobs').delete().eq('id', job.id);
    await supabase.from('bookings').delete().eq('id', booking.id);
    await supabase.from('properties').delete().eq('id', propertyId);
    await supabase.from('services').delete().eq('id', serviceId);
    await supabase.from('professional_profiles').delete().eq('user_id', professionalId);
    await supabase.from('profiles').delete().in('id', [customerId, professionalId]);

    if (error) {
      console.log(`✓ Transition rejected: ${error.message}`);
      result.actualResult = 'DENIED (exception raised)';
      result.error = error.message;
      result.pass = error.message.includes('Invalid state transition');
    } else {
      console.log(`❌ Transition succeeded unexpectedly!`);
      result.actualResult = 'ALLOWED (unexpected!)';
      result.pass = false;
    }
  } catch (err) {
    console.error(`❌ Test error: ${err.message}`);
    result.actualResult = 'ERROR: Exception during test';
    result.error = err.message;
    result.pass = false;
  }

  results.push(result);
  console.log(`Result: ${result.pass ? '✅ PASS' : '❌ FAIL'}\n`);
}

// Test 2: Try backward transition from quote_pending to assigned
async function test2_quotePendingBackward() {
  console.log('TEST 2: quote_pending → assigned (backward, MUST BE DENIED)');
  console.log('─'.repeat(60));

  const result = {
    testName: 'quote_pending → assigned (backward, MUST BE DENIED)',
    method: 'RPC: transition_job_state()',
    input: {
      job_id: null,
      from_state: 'quote_pending',
      to_state: 'assigned',
      actor: 'test-user-456',
    },
    expectedResult: 'DENIED',
    actualResult: '',
    error: null,
    pass: false,
  };

  try {
    // Create test job
    const { data: job, error: createError } = await supabase
      .from('jobs')
      .insert({
        booking_id: crypto.randomUUID(),
        professional_id: crypto.randomUUID(),
        current_state: 'assigned',
      })
      .select()
      .single();

    if (createError) {
      console.error(`❌ Failed to create test job: ${createError.message}`);
      result.pass = false;
      result.actualResult = 'ERROR: Could not create test job';
      results.push(result);
      return;
    }

    result.input.job_id = job.id;
    console.log(`✓ Created test job: ${job.id}`);

    // Transition through valid path to quote_pending
    const transitions = ['accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending'];
    const actor = crypto.randomUUID();

    for (const state of transitions) {
      const { error } = await supabase.rpc('transition_job_state', {
        p_job_id: job.id,
        p_new_state: state,
        p_actor_user_id: actor,
        p_metadata: { setup: true },
      });

      if (error) {
        console.error(`❌ Setup failed at ${state}: ${error.message}`);
        await supabase.from('jobs').delete().eq('id', job.id);
        result.pass = false;
        result.actualResult = `ERROR: Could not reach quote_pending state`;
        results.push(result);
        return;
      }
    }

    console.log(`✓ Transitioned to quote_pending state`);

    // Try backward transition (should fail)
    const { error } = await supabase.rpc('transition_job_state', {
      p_job_id: job.id,
      p_new_state: 'assigned',
      p_actor_user_id: actor,
      p_metadata: { test: true },
    });

    // Cleanup
    await supabase.from('jobs').delete().eq('id', job.id);

    if (error) {
      console.log(`✓ Backward transition rejected: ${error.message}`);
      result.actualResult = 'DENIED (exception raised)';
      result.error = error.message;
      result.pass = error.message.includes('Invalid state transition');
    } else {
      console.log(`❌ Backward transition succeeded unexpectedly!`);
      result.actualResult = 'ALLOWED (unexpected!)';
      result.pass = false;
    }
  } catch (err) {
    console.error(`❌ Test error: ${err.message}`);
    result.actualResult = 'ERROR: Exception during test';
    result.error = err.message;
    result.pass = false;
  }

  results.push(result);
  console.log(`Result: ${result.pass ? '✅ PASS' : '❌ FAIL'}\n`);
}

// Test 3: Try to transition from completed state (terminal, no transitions allowed)
async function test3_completedNoTransition() {
  console.log('TEST 3: completed → in_progress (MUST BE DENIED)');
  console.log('─'.repeat(60));

  const result = {
    testName: 'completed → in_progress (MUST BE DENIED)',
    method: 'RPC: transition_job_state()',
    input: {
      job_id: null,
      from_state: 'completed',
      to_state: 'in_progress',
      actor: 'test-user-789',
    },
    expectedResult: 'DENIED',
    actualResult: '',
    error: null,
    pass: false,
  };

  try {
    // Create test job and manually set to completed (bypassing state machine for setup)
    const { data: job, error: createError } = await supabase
      .from('jobs')
      .insert({
        booking_id: crypto.randomUUID(),
        professional_id: crypto.randomUUID(),
        current_state: 'completed',
      })
      .select()
      .single();

    if (createError) {
      console.error(`❌ Failed to create test job: ${createError.message}`);
      result.pass = false;
      result.actualResult = 'ERROR: Could not create test job';
      results.push(result);
      return;
    }

    result.input.job_id = job.id;
    console.log(`✓ Created test job in completed state: ${job.id}`);

    // Try transition from completed (should fail)
    const { error } = await supabase.rpc('transition_job_state', {
      p_job_id: job.id,
      p_new_state: 'in_progress',
      p_actor_user_id: crypto.randomUUID(),
      p_metadata: { test: true },
    });

    // Cleanup
    await supabase.from('jobs').delete().eq('id', job.id);

    if (error) {
      console.log(`✓ Transition from completed rejected: ${error.message}`);
      result.actualResult = 'DENIED (exception raised)';
      result.error = error.message;
      result.pass = error.message.includes('Invalid state transition');
    } else {
      console.log(`❌ Transition from completed succeeded unexpectedly!`);
      result.actualResult = 'ALLOWED (unexpected!)';
      result.pass = false;
    }
  } catch (err) {
    console.error(`❌ Test error: ${err.message}`);
    result.actualResult = 'ERROR: Exception during test';
    result.error = err.message;
    result.pass = false;
  }

  results.push(result);
  console.log(`Result: ${result.pass ? '✅ PASS' : '❌ FAIL'}\n`);
}

// Test 4: Valid transition should succeed
async function test4_validTransition() {
  console.log('TEST 4: assigned → accepted → on_the_way (MUST BE ALLOWED)');
  console.log('─'.repeat(60));

  const result = {
    testName: 'assigned → accepted → on_the_way (MUST BE ALLOWED)',
    method: 'RPC: transition_job_state()',
    input: {
      job_id: null,
      from_state: 'assigned',
      to_state: 'accepted then on_the_way',
      actor: 'test-user-valid',
    },
    expectedResult: 'ALLOWED',
    actualResult: '',
    error: null,
    pass: false,
  };

  try {
    // Create test job
    const { data: job, error: createError } = await supabase
      .from('jobs')
      .insert({
        booking_id: crypto.randomUUID(),
        professional_id: crypto.randomUUID(),
        current_state: 'assigned',
      })
      .select()
      .single();

    if (createError) {
      console.error(`❌ Failed to create test job: ${createError.message}`);
      result.pass = false;
      result.actualResult = 'ERROR: Could not create test job';
      results.push(result);
      return;
    }

    result.input.job_id = job.id;
    console.log(`✓ Created test job: ${job.id}`);

    const actor = crypto.randomUUID();

    // First valid transition: assigned → accepted
    const { error: err1 } = await supabase.rpc('transition_job_state', {
      p_job_id: job.id,
      p_new_state: 'accepted',
      p_actor_user_id: actor,
      p_metadata: { step: 1 },
    });

    if (err1) {
      console.error(`❌ First transition failed: ${err1.message}`);
      await supabase.from('jobs').delete().eq('id', job.id);
      result.actualResult = 'DENIED (first transition failed)';
      result.error = err1.message;
      result.pass = false;
      results.push(result);
      return;
    }

    console.log(`✓ First transition succeeded (assigned → accepted)`);

    // Second valid transition: accepted → on_the_way
    const { error: err2 } = await supabase.rpc('transition_job_state', {
      p_job_id: job.id,
      p_new_state: 'on_the_way',
      p_actor_user_id: actor,
      p_metadata: { step: 2 },
    });

    // Cleanup
    await supabase.from('jobs').delete().eq('id', job.id);

    if (err2) {
      console.error(`❌ Second transition failed: ${err2.message}`);
      result.actualResult = 'DENIED (second transition failed)';
      result.error = err2.message;
      result.pass = false;
    } else {
      console.log(`✓ Second transition succeeded (accepted → on_the_way)`);
      result.actualResult = 'ALLOWED (both transitions succeeded)';
      result.pass = true;
    }
  } catch (err) {
    console.error(`❌ Test error: ${err.message}`);
    result.actualResult = 'ERROR: Exception during test';
    result.error = err.message;
    result.pass = false;
  }

  results.push(result);
  console.log(`Result: ${result.pass ? '✅ PASS' : '❌ FAIL'}\n`);
}

// Generate report
function generateReport() {
  const passCount = results.filter(r => r.pass).length;
  const totalCount = results.length;

  let report = `# Phase 3 State Machine Enforcement Test Results\n\n`;
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Status:** ${passCount === totalCount ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`;
  report += `**Score:** ${passCount}/${totalCount} tests passed\n\n`;

  report += `## Test Summary\n\n`;
  report += `| Test # | Test Name | Method | Expected | Actual | Status |\n`;
  report += `|--------|-----------|--------|----------|--------|--------|\n`;

  results.forEach((result, idx) => {
    const status = result.pass ? '✅ PASS' : '❌ FAIL';
    report += `| ${idx + 1} | ${result.testName} | ${result.method} | ${result.expectedResult} | ${result.actualResult} | ${status} |\n`;
  });

  report += `\n## Detailed Results\n\n`;

  results.forEach((result, idx) => {
    report += `### Test ${idx + 1}: ${result.testName}\n`;
    report += `- **Method:** ${result.method}\n`;
    report += `- **Input:** job_id=${result.input.job_id || 'N/A'}\n`;
    report += `- **Transition:** ${result.input.from_state} → ${result.input.to_state}\n`;
    report += `- **Expected Result:** ${result.expectedResult}\n`;
    report += `- **Actual Result:** ${result.actualResult}\n`;
    if (result.error) {
      report += `- **Error/Message:** ${result.error}\n`;
    }
    report += `- **Test Result:** ${result.pass ? '✅ PASS' : '❌ FAIL'}\n\n`;
  });

  report += `## Conclusion\n\n`;
  if (passCount === totalCount) {
    report += `✅ **All ${totalCount} tests PASSED!**\n\n`;
    report += `The state machine enforcement is working correctly:\n`;
    report += `- Invalid transitions are properly rejected\n`;
    report += `- Valid transitions are allowed\n`;
    report += `- The RPC layer is enforcing business rules at the database level\n`;
  } else {
    report += `❌ **${totalCount - passCount} test(s) FAILED!**\n\n`;
    report += `The following issues need to be addressed:\n`;
    results.forEach((result, idx) => {
      if (!result.pass) {
        report += `- Test ${idx + 1}: ${result.testName}\n`;
        if (result.error) {
          report += `  Error: ${result.error}\n`;
        }
      }
    });
  }

  return report;
}

// Run all tests
async function runAllTests() {
  try {
    await test1_assignedToCompleted();
    await test2_quotePendingBackward();
    await test3_completedNoTransition();
    await test4_validTransition();

    const report = generateReport();
    console.log('\n' + '='.repeat(60));
    console.log('FINAL REPORT');
    console.log('='.repeat(60) + '\n');
    console.log(report);

    // Write to file
    const reportPath = path.join(projectRoot, '.agents/tasks/phase3-test-results.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n✅ Report written to: ${reportPath}\n`);

    // Exit with appropriate code
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
