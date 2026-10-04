const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azmajqztvcuwajaaldqm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bWFqcXp0dmN1d2FqYWFsZHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA5NTc5NywiZXhwIjoyMTA1NjcxNzk3fQ.m2Cpzmwvn1Bfzcp9-gmpxsrn6PWkt3jgC5DoMuHKlPs';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' }
});

async function checkRLS() {
  console.log('='.repeat(80));
  console.log('CHECKING SUPABASE RLS CONFIGURATION');
  console.log('='.repeat(80));

  // 1. Try basic jobs query
  console.log('\n1. Testing basic jobs table access...');
  try {
    const { data, error, count } = await supabase
      .from('jobs')
      .select('id, current_state', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log('✗ Error:', error.message);
    } else {
      console.log('✓ Jobs accessible. Found', count, 'total jobs');
      if (data && data.length > 0) {
        console.log('  Sample:', data[0]);
      }
    }
  } catch (e) {
    console.log('✗ Exception:', e.message);
  }

  // 2. Try job_events relationship
  console.log('\n2. Testing job_events table access...');
  try {
    const { data, error, count } = await supabase
      .from('job_events')
      .select('id, to_state, created_at', { count: 'exact' })
      .limit(3);
    
    if (error) {
      console.log('✗ Error:', error.message);
    } else {
      console.log('✓ job_events accessible. Found', count, 'total events');
      if (data && data.length > 0) {
        console.log('  Sample events:', data);
      }
    }
  } catch (e) {
    console.log('✗ Exception:', e.message);
  }

  // 3. Try transition_job_state RPC
  console.log('\n3. Testing transition_job_state RPC function...');
  try {
    const { data, error } = await supabase.rpc('transition_job_state', {
      p_job_id: '00000000-0000-0000-0000-000000000000',
      p_new_state: 'test',
      p_actor_user_id: '00000000-0000-0000-0000-000000000000',
    });
    
    if (error) {
      if (error.message.includes('Invalid state transition')) {
        console.log('✓ Function exists and validates (received expected validation error)');
      } else if (error.message.includes('row not found')) {
        console.log('✓ Function exists and runs (expected: job not found)');
      } else {
        console.log('Function error:', error.message);
      }
    } else {
      console.log('✓ Function returned:', data);
    }
  } catch (e) {
    console.log('Exception:', e.message);
  }

  // 4. Try notification_logs
  console.log('\n4. Testing notification_logs table access...');
  try {
    const { data, error, count } = await supabase
      .from('notification_logs')
      .select('id, notification_type', { count: 'exact' })
      .limit(3);
    
    if (error) {
      console.log('✗ Error:', error.message);
    } else {
      console.log('✓ notification_logs accessible. Found', count, 'total records');
      if (data && data.length > 0) {
        console.log('  Sample records:', data);
      }
    }
  } catch (e) {
    console.log('✗ Exception:', e.message);
  }

  console.log('\n' + '='.repeat(80));
}

checkRLS().catch(console.error);
