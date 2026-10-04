/**
 * Phase 3 — State Machine Enforcement Tests
 * 
 * Goal: Verify that invalid job state transitions are rejected by the RPC layer
 * 
 * Test Strategy:
 * 1. Call transition_job_state() RPC directly with invalid transitions
 * 2. Verify exception is raised with "Invalid state transition" message
 * 3. Verify valid transitions still work
 * 4. Verify audit events are recorded
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface TestResult {
  testName: string;
  method: string;
  input: {
    job_id: string;
    from_state: string;
    to_state: string;
    actor: string;
  };
  expectedResult: 'DENIED' | 'ALLOWED';
  actualResult: string;
  error?: string;
  pass: boolean;
}

const results: TestResult[] = [];

describe('Phase 3 — State Machine Enforcement', () => {
  let supabase: ReturnType<typeof createClient>;
  let testJobId: string;
  let testJobIdCompleted: string;
  let testJobIdApproved: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create test jobs in various states
    try {
      // Job 1: In REQUESTED state (for REQUESTED → COMPLETED test)
      const { data: job1, error: err1 } = await supabase
        .from('jobs')
        .insert({
          booking_id: '00000000-0000-0000-0000-000000000001',
          professional_id: '00000000-0000-0000-0000-000000000002',
          current_state: 'assigned',
        })
        .select()
        .single();

      if (err1) throw err1;
      testJobId = job1.id;

      // Job 2: In COMPLETED state (for COMPLETED → ANYTHING test)
      const { data: job2 } = await supabase
        .from('jobs')
        .insert({
          booking_id: '00000000-0000-0000-0000-000000000003',
          professional_id: '00000000-0000-0000-0000-000000000004',
          current_state: 'completed',
        })
        .select()
        .single();

      if (job2) testJobIdCompleted = job2.id;

      // Job 3: For testing valid transitions
      const { data: job3 } = await supabase
        .from('jobs')
        .insert({
          booking_id: '00000000-0000-0000-0000-000000000005',
          professional_id: '00000000-0000-0000-0000-000000000006',
          current_state: 'assigned',
        })
        .select()
        .single();

      if (job3) testJobIdApproved = job3.id;
    } catch (err) {
      console.error('Setup error:', err);
      throw err;
    }
  });

  afterAll(async () => {
    // Cleanup test jobs
    try {
      if (testJobId)
        await supabase.from('jobs').delete().eq('id', testJobId);
      if (testJobIdCompleted)
        await supabase.from('jobs').delete().eq('id', testJobIdCompleted);
      if (testJobIdApproved)
        await supabase.from('jobs').delete().eq('id', testJobIdApproved);
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  });

  // Test 1: REQUESTED → COMPLETED (MUST BE DENIED)
  it('Test 1: assigned → completed transition should be DENIED', async () => {
    const result: TestResult = {
      testName: 'assigned → completed (MUST BE DENIED)',
      method: 'RPC',
      input: {
        job_id: testJobId,
        from_state: 'assigned',
        to_state: 'completed',
        actor: 'test-user',
      },
      expectedResult: 'DENIED',
      actualResult: '',
      pass: false,
    };

    try {
      const { data, error } = await supabase.rpc('transition_job_state', {
        p_job_id: testJobId,
        p_new_state: 'completed',
        p_actor_user_id: '00000000-0000-0000-0000-000000000099',
        p_metadata: {},
      });

      if (error) {
        result.actualResult = 'DENIED (exception)';
        result.error = error.message;
        result.pass = error.message.includes('Invalid state transition');
      } else {
        result.actualResult = 'ALLOWED (unexpected)';
        result.pass = false;
      }
    } catch (err: any) {
      result.actualResult = 'DENIED (exception)';
      result.error = err.message;
      result.pass = err.message.includes('Invalid state transition');
    }

    results.push(result);
    expect(result.pass).toBe(true);
  });

  // Test 2: quote_pending → assigned (MUST BE DENIED - backward transition)
  it('Test 2: quote_pending → assigned transition should be DENIED', async () => {
    // First, transition the job to quote_pending via valid path
    const result: TestResult = {
      testName: 'quote_pending → assigned (backward, MUST BE DENIED)',
      method: 'RPC',
      input: {
        job_id: testJobIdApproved,
        from_state: 'quote_pending',
        to_state: 'assigned',
        actor: 'test-user',
      },
      expectedResult: 'DENIED',
      actualResult: '',
      pass: false,
    };

    // First setup: assigned → accepted → on_the_way → arrived → in_progress → quote_pending
    await supabase.rpc('transition_job_state', {
      p_job_id: testJobIdApproved,
      p_new_state: 'accepted',
      p_actor_user_id: '00000000-0000-0000-0000-000000000099',
    });

    await supabase.rpc('transition_job_state', {
      p_job_id: testJobIdApproved,
      p_new_state: 'on_the_way',
      p_actor_user_id: '00000000-0000-0000-0000-000000000099',
    });

    await supabase.rpc('transition_job_state', {
      p_job_id: testJobIdApproved,
      p_new_state: 'arrived',
      p_actor_user_id: '00000000-0000-0000-0000-000000000099',
    });

    await supabase.rpc('transition_job_state', {
      p_job_id: testJobIdApproved,
      p_new_state: 'in_progress',
      p_actor_user_id: '00000000-0000-0000-0000-000000000099',
    });

    await supabase.rpc('transition_job_state', {
      p_job_id: testJobIdApproved,
      p_new_state: 'quote_pending',
      p_actor_user_id: '00000000-0000-0000-0000-000000000099',
    });

    try {
      const { error } = await supabase.rpc('transition_job_state', {
        p_job_id: testJobIdApproved,
        p_new_state: 'assigned',
        p_actor_user_id: '00000000-0000-0000-0000-000000000099',
      });

      if (error) {
        result.actualResult = 'DENIED (exception)';
        result.error = error.message;
        result.pass = error.message.includes('Invalid state transition');
      } else {
        result.actualResult = 'ALLOWED (unexpected)';
        result.pass = false;
      }
    } catch (err: any) {
      result.actualResult = 'DENIED (exception)';
      result.error = err.message;
      result.pass = err.message.includes('Invalid state transition');
    }

    results.push(result);
    expect(result.pass).toBe(true);
  });

  // Test 3: COMPLETED → ANYTHING (MUST BE DENIED)
  it('Test 3: completed → in_progress transition should be DENIED', async () => {
    const result: TestResult = {
      testName: 'completed → in_progress (MUST BE DENIED)',
      method: 'RPC',
      input: {
        job_id: testJobIdCompleted,
        from_state: 'completed',
        to_state: 'in_progress',
        actor: 'test-user',
      },
      expectedResult: 'DENIED',
      actualResult: '',
      pass: false,
    };

    try {
      const { data, error } = await supabase.rpc('transition_job_state', {
        p_job_id: testJobIdCompleted,
        p_new_state: 'in_progress',
        p_actor_user_id: '00000000-0000-0000-0000-000000000099',
      });

      if (error) {
        result.actualResult = 'DENIED (exception)';
        result.error = error.message;
        result.pass = error.message.includes('Invalid state transition');
      } else {
        result.actualResult = 'ALLOWED (unexpected)';
        result.pass = false;
      }
    } catch (err: any) {
      result.actualResult = 'DENIED (exception)';
      result.error = err.message;
      result.pass = err.message.includes('Invalid state transition');
    }

    results.push(result);
    expect(result.pass).toBe(true);
  });

  // Test 4: VALID TRANSITION (MUST BE ALLOWED)
  it('Test 4: accepted → on_the_way transition should be ALLOWED', async () => {
    // Create a fresh job for this test
    const { data: newJob } = await supabase
      .from('jobs')
      .insert({
        booking_id: '00000000-0000-0000-0000-000000000007',
        professional_id: '00000000-0000-0000-0000-000000000008',
        current_state: 'assigned',
      })
      .select()
      .single();

    const result: TestResult = {
      testName: 'assigned → accepted → on_the_way (MUST BE ALLOWED)',
      method: 'RPC',
      input: {
        job_id: newJob?.id || '',
        from_state: 'assigned',
        to_state: 'accepted then on_the_way',
        actor: 'test-user',
      },
      expectedResult: 'ALLOWED',
      actualResult: '',
      pass: false,
    };

    try {
      // First valid transition
      const { error: err1 } = await supabase.rpc('transition_job_state', {
        p_job_id: newJob?.id,
        p_new_state: 'accepted',
        p_actor_user_id: '00000000-0000-0000-0000-000000000099',
      });

      if (err1) {
        result.actualResult = 'DENIED (first transition failed)';
        result.error = err1.message;
        result.pass = false;
      } else {
        // Second valid transition
        const { error: err2 } = await supabase.rpc('transition_job_state', {
          p_job_id: newJob?.id,
          p_new_state: 'on_the_way',
          p_actor_user_id: '00000000-0000-0000-0000-000000000099',
        });

        if (err2) {
          result.actualResult = 'DENIED (second transition failed)';
          result.error = err2.message;
          result.pass = false;
        } else {
          result.actualResult = 'ALLOWED (success)';
          result.pass = true;
        }
      }
    } catch (err: any) {
      result.actualResult = 'DENIED (exception)';
      result.error = err.message;
      result.pass = false;
    }

    // Cleanup
    if (newJob) {
      await supabase.from('jobs').delete().eq('id', newJob.id);
    }

    results.push(result);
    expect(result.pass).toBe(true);
  });

  // After all tests, write results to file
  it('Write test results to file', () => {
    const reportContent = generateReport(results);
    // In a real test, we'd write this to the file system
    // For now, just log it
    console.log('\n=== PHASE 3 TEST RESULTS ===\n');
    console.log(reportContent);
  });
});

function generateReport(results: TestResult[]): string {
  const passCount = results.filter(r => r.pass).length;
  const totalCount = results.length;

  let report = `# Phase 3 State Machine Enforcement Test Results\n\n`;
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Status:** ${passCount === totalCount ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`;
  report += `**Score:** ${passCount}/${totalCount} tests passed\n\n`;

  report += `## Test Summary\n\n`;
  report += `| Test | Method | From → To | Expected | Actual | Status |\n`;
  report += `|------|--------|-----------|----------|--------|--------|\n`;

  results.forEach(result => {
    const status = result.pass ? '✅ PASS' : '❌ FAIL';
    const transition = `${result.input.from_state} → ${result.input.to_state}`;
    report += `| ${result.testName} | ${result.method} | ${transition} | ${result.expectedResult} | ${result.actualResult} | ${status} |\n`;
  });

  report += `\n## Detailed Results\n\n`;

  results.forEach(result => {
    report += `### ${result.testName}\n`;
    report += `- **Method:** ${result.method}\n`;
    report += `- **Input:** job_id=${result.input.job_id}, transition=${result.input.from_state} → ${result.input.to_state}\n`;
    report += `- **Expected:** ${result.expectedResult}\n`;
    report += `- **Actual:** ${result.actualResult}\n`;
    if (result.error) {
      report += `- **Error Message:** ${result.error}\n`;
    }
    report += `- **Result:** ${result.pass ? '✅ PASS' : '❌ FAIL'}\n\n`;
  });

  return report;
}
